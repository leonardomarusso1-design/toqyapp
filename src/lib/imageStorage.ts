import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Bug real corrigido em 2026-07-06: toda imagem de biosite (logo, assinatura,
// fundo, fotos de catálogo) era salva como base64 embutido direto no JSON
// (toqy_biosites.site_data) — uma única resposta de /api/real-templates
// chegou a pesar 6.8MB por causa disso, e isso estourou o limite gratuito de
// Fast Origin Transfer da Vercel. Esta função centraliza o upload de uma
// imagem base64 pro Supabase Storage, devolvendo um link público leve e
// cacheável em vez do texto-imagem inteiro. Usada tanto pelo upload novo
// (ImageUploadField -> /api/upload-image) quanto pela migração retroativa
// dos biosites que já existem (/api/admin/migrate-images).
//
// Endurecimento de segurança (2026-09-06, auditoria externa): antes disso a
// única "validação" era a regex `data:image/(\w+)` — ou seja, o atacante
// declarava o MIME que quisesse no próprio payload e a gente acreditava.
// Dava pra subir HTML, SVG com <script>, ou qualquer binário arbitrário
// rotulado de `data:image/png`, e o arquivo virava URL pública num domínio
// nosso (XSS armazenado, hospedagem de malware, phishing). Agora o formato é
// decidido pelos MAGIC BYTES do conteúdo real, não pelo que o cliente diz.

export const BIOSITE_IMAGES_BUCKET = "biosite-images";

// Teto de bytes do arquivo já decodificado. Casado com o MAX_BYTES do
// ImageUploadField (5MB) pra não quebrar upload legítimo — o cliente ainda
// redimensiona pra 800px antes de enviar, então na prática fica muito abaixo
// disso. O limite existe porque a Vercel Function decodifica o base64 em
// memória: sem teto ANTES do Buffer.from(), um payload de 100MB de base64
// vira 75MB de RAM alocada por requisição (abuso de memória trivial).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Allowlist de formato por conteúdo real. SVG está fora DE PROPÓSITO: é XML
// executável (pode conter <script>/onload) e, servido de um domínio nosso,
// vira XSS armazenado. GIF/BMP/TIFF também ficam de fora — o cliente nunca
// gera esses formatos, então aceitar só amplia a superfície de ataque.
const IMAGE_CONTENT_TYPE = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;
type AllowedImageExt = keyof typeof IMAGE_CONTENT_TYPE;

/**
 * Erro de validação do payload (culpa do cliente, não do servidor). A rota
 * usa isso pra responder 400 com a mensagem — que é sempre escrita por nós,
 * nunca repassada de um serviço externo.
 */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Identifica o formato real olhando a assinatura dos primeiros bytes. O MIME
 * declarado no data URL é só texto que o cliente escolheu — não prova nada
 * sobre o conteúdo. Devolve null se não bater com nenhum formato permitido.
 */
function detectImageExt(buffer: Buffer): AllowedImageExt | null {
  // JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && PNG_SIGNATURE.every((byte, i) => buffer[i] === byte)) return "png";

  // WebP: container RIFF ("RIFF" nos bytes 0-3) com o tipo "WEBP" nos bytes
  // 8-11 (os bytes 4-7 são o tamanho do arquivo, variável).
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

/**
 * Tamanho aproximado (em bytes) do conteúdo depois de decodificar o base64,
 * calculado SEM decodificar — 4 caracteres base64 viram 3 bytes. Serve pra
 * rejeitar um payload gigante antes de gastar memória com Buffer.from().
 */
function approxDecodedBytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Transforma um pedaço controlado pelo usuário (slug, fieldId) num segmento
 * de caminho seguro. O nome final do arquivo é gerado pelo servidor
 * (randomUUID) — o cliente não escolhe nome nem extensão, e não consegue
 * escapar da pasta com "../" nem sobrescrever um objeto existente.
 */
function safeSegment(value: string, fallback: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || fallback;
}

/**
 * Valida o data URL e devolve o buffer + formato REAL. Lança
 * UploadValidationError com mensagem amigável em qualquer caso inválido.
 */
function parseImageDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: AllowedImageExt } {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) throw new UploadValidationError("Formato de imagem não reconhecido. Envie um JPG, PNG ou WebP.");

  const declared = match[1].toLowerCase();
  const base64 = match[2];

  // Rejeição explícita de SVG antes de qualquer decodificação — é o vetor de
  // XSS mais óbvio e merece mensagem própria pro usuário entender.
  if (declared === "svg+xml" || declared === "svg") {
    throw new UploadValidationError("SVG não é aceito por segurança. Envie um JPG, PNG ou WebP.");
  }

  // Limite ANTES do decode (o ponto do achado da auditoria): mede o tamanho
  // pelo comprimento da string base64 em vez de alocar o buffer primeiro.
  if (approxDecodedBytes(base64) > MAX_IMAGE_BYTES) {
    throw new UploadValidationError(`Imagem muito grande (máx. ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB).`);
  }

  const buffer = Buffer.from(base64, "base64");

  // E de novo depois do decode: a estimativa acima é aproximada (padding,
  // caracteres inválidos ignorados pelo decoder), então o valor real manda.
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new UploadValidationError(`Imagem muito grande (máx. ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB).`);
  }

  const ext = detectImageExt(buffer);
  if (!ext) {
    throw new UploadValidationError("O arquivo enviado não é uma imagem válida. Envie um JPG, PNG ou WebP.");
  }

  // contentType vem do formato DETECTADO, nunca do declarado — assim não dá
  // pra servir conteúdo com um Content-Type escolhido pelo atacante.
  return { buffer, contentType: IMAGE_CONTENT_TYPE[ext], ext };
}

let bucketChecked = false;

/**
 * Confere que o bucket existe — e NÃO cria se faltar (2026-09-06, auditoria).
 * Criar bucket é tarefa de migration/deploy, não de requisição de usuário:
 * fazer isso no caminho de upload significa que qualquer request pode criar
 * infraestrutura pública, e um erro de digitação no nome do bucket cria um
 * bucket novo em silêncio em vez de falhar. Se este erro aparecer, provisione
 * o bucket na migration do Supabase (público, com fileSizeLimit).
 */
async function assertBucketExists(supabase: SupabaseClient) {
  if (bucketChecked) return;

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("[imageStorage] listBuckets falhou:", error);
    throw new Error("Armazenamento de imagens indisponível.");
  }

  if (!buckets?.some((b) => b.name === BIOSITE_IMAGES_BUCKET)) {
    console.error(`[imageStorage] bucket "${BIOSITE_IMAGES_BUCKET}" não existe — provisione via migration/deploy.`);
    throw new Error("Armazenamento de imagens indisponível.");
  }

  bucketChecked = true;
}

/**
 * Sobe uma imagem em base64 (data URL) pro Supabase Storage e devolve a URL
 * pública. Se `value` não for um data URL de imagem (já é uma URL normal, ou
 * está vazio), devolve o próprio valor sem fazer nada — idempotente, seguro
 * pra chamar em qualquer campo sem checar antes se precisa migrar.
 *
 * Mudança de comportamento (2026-09-06, auditoria): antes, um `data:image`
 * malformado era devolvido como estava ("não derruba o fluxo"). Isso era o
 * pior dos dois mundos — o payload não validado ia parar dentro do
 * site_data como base64 (justamente o bug de 2026-07-06) e, no caso de um
 * SVG, era renderizado no bio site. Agora payload inválido LANÇA.
 */
export async function uploadImageIfBase64(
  supabase: SupabaseClient,
  slug: string,
  fieldId: string,
  value: string | undefined
): Promise<string | undefined> {
  if (!value || !value.startsWith("data:image")) return value;

  const parsed = parseImageDataUrl(value);

  await assertBucketExists(supabase);

  // Nome 100% gerado no servidor: pasta derivada do slug (sanitizada) e
  // arquivo com UUID. Sem upsert, pra não permitir sobrescrever objeto que
  // já existe.
  const path = `${safeSegment(slug, "sem-slug")}/${safeSegment(fieldId, "campo")}-${randomUUID()}.${parsed.ext}`;
  const { error } = await supabase.storage.from(BIOSITE_IMAGES_BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: false,
  });
  if (error) {
    // Erro do Supabase Storage fica no log do servidor; o cliente recebe só
    // uma mensagem genérica (a original pode vazar nome de bucket, política
    // de RLS, detalhe de infraestrutura).
    console.error(`[imageStorage] upload falhou (campo=${fieldId}):`, error);
    throw new Error("Não foi possível salvar a imagem. Tente novamente.");
  }

  const { data } = supabase.storage.from(BIOSITE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
