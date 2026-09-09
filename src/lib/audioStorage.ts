import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadValidationError } from "./imageStorage";

// Música própria hospedada no Toqy (2026-09-06, pedido do Leonardo:
// "hospedar as músicas que ela tem baixado no pc ou celular, no próprio
// Toqy" — antes disso o campo só aceitava um link externo). Mesmo padrão
// de src/lib/imageStorage.ts (upload de base64 pro Supabase Storage,
// devolve URL pública) — bucket e limite de tamanho diferentes.
//
// Endurecimento de segurança (2026-09-06, auditoria externa): mesma falha
// que a de imagem — o formato vinha da regex `data:audio/(\w+)`, ou seja,
// do rótulo que o próprio cliente escreveu. Qualquer binário (ou HTML)
// rotulado de `data:audio/mpeg` era aceito e virava URL pública num domínio
// nosso. Além disso, o MAX_AUDIO_BYTES só era checado DEPOIS do
// Buffer.from(), então um payload gigante já tinha sido alocado em memória
// antes de ser rejeitado. Agora: allowlist por magic bytes + limite antes
// do decode.

// Reexportado pra rota de áudio poder distinguir erro de validação (400)
// de erro interno (500) sem precisar importar do módulo de imagem.
export { UploadValidationError };

export const BIOSITE_AUDIO_BUCKET = "biosite-audio";

// Limite real: Vercel Functions aceita ~4,5MB por corpo de requisição
// (não configurável no plano do Leonardo) — o upload chega em base64
// (~33% maior que o arquivo original), então o arquivo bruto precisa ficar
// bem abaixo disso. 4MB de arquivo ~= 5,3MB em base64, já é arriscado;
// usamos 3,5MB de arquivo como teto seguro (~4,7MB em base64, com folga
// pro resto do JSON). Cobre confortavelmente ~60s de mp3 em qualidade
// razoável (128kbps ~= 1MB/min).
export const MAX_AUDIO_BYTES = 3.5 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 60;

// Allowlist por conteúdo real. Formatos que o navegador realmente entrega
// no seletor de arquivo de áudio; qualquer outra coisa é rejeitada.
const AUDIO_CONTENT_TYPE = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  wav: "audio/wav",
} as const;
type AllowedAudioExt = keyof typeof AUDIO_CONTENT_TYPE;

/**
 * Identifica o formato real pelos primeiros bytes. O MIME declarado no data
 * URL não prova nada — é string escolhida pelo cliente.
 */
function detectAudioExt(buffer: Buffer): AllowedAudioExt | null {
  if (buffer.length < 12) return null;

  // MP3 com tag ID3 no começo: "ID3" (49 44 33)
  if (buffer.toString("ascii", 0, 3) === "ID3") return "mp3";

  // MP3 sem tag: frame sync MPEG são 11 bits ligados — FF seguido de um byte
  // com os 3 bits altos em 1 (FF Fx cobre MPEG-1/2; FF Ex é MPEG-2.5).
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "mp3";

  // M4A/MP4: container ISO-BMFF — "ftyp" no offset 4 (os 4 primeiros bytes
  // são o tamanho do box).
  if (buffer.toString("ascii", 4, 8) === "ftyp") return "m4a";

  // OGG: "OggS"
  if (buffer.toString("ascii", 0, 4) === "OggS") return "ogg";

  // WAV: container RIFF ("RIFF" nos bytes 0-3) com o tipo "WAVE" nos bytes
  // 8-11 (os bytes 4-7 são o tamanho, variável).
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WAVE") return "wav";

  return null;
}

/**
 * Tamanho aproximado (em bytes) do conteúdo depois de decodificar o base64,
 * calculado SEM decodificar — 4 caracteres base64 viram 3 bytes.
 */
function approxDecodedBytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

function safeSegment(value: string, fallback: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || fallback;
}

const SIZE_ERROR = `Áudio muito grande (máx. ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB, ~${MAX_AUDIO_SECONDS}s em boa qualidade).`;

function parseAudioDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: AllowedAudioExt } {
  // Bug real reportado ao vivo (2026-09-08): "tentei colocar uma música
  // de 16seg do meu computador direto, não consegui" — gravação de voz
  // do Windows/Mac (.m4a) às vezes chega no navegador com `file.type`
  // vazio, e `FileReader.readAsDataURL()` então gera um data URL tipo
  // `data:application/octet-stream;base64,...` (ou até `data:;base64,`)
  // em vez de `data:audio/...`. O regex exigia o prefixo `audio/` — mas
  // quem REALMENTE valida o formato são os magic bytes (detectAudioExt
  // abaixo), então exigir o MIME aqui só rejeitava áudio de verdade com
  // rótulo "errado". Agora aceita qualquer `data:<mime>;base64,...`; o
  // MIME declarado nunca é usado pra decidir nada, só pra casar a regex.
  const match = /^data:[a-zA-Z0-9.+/-]*;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) throw new UploadValidationError("Formato de áudio não reconhecido. Envie um mp3, m4a, ogg ou wav.");

  const base64 = match[1];

  // Limite ANTES do decode (achado da auditoria): antes disso o
  // Buffer.from() rodava primeiro e só depois o tamanho era conferido.
  if (approxDecodedBytes(base64) > MAX_AUDIO_BYTES) throw new UploadValidationError(SIZE_ERROR);

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_AUDIO_BYTES) throw new UploadValidationError(SIZE_ERROR);

  const ext = detectAudioExt(buffer);
  if (!ext) throw new UploadValidationError("O arquivo enviado não é um áudio válido. Envie um mp3, m4a, ogg ou wav.");

  // contentType vem do formato DETECTADO, nunca do declarado.
  return { buffer, contentType: AUDIO_CONTENT_TYPE[ext], ext };
}

let bucketChecked = false;

/**
 * Confere que o bucket existe — e NÃO cria se faltar (2026-09-06, auditoria).
 * Criar bucket é tarefa de migration/deploy, não de requisição de usuário.
 * Se este erro aparecer, provisione o bucket na migration do Supabase
 * (público, com fileSizeLimit).
 */
async function assertBucketExists(supabase: SupabaseClient) {
  if (bucketChecked) return;

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("[audioStorage] listBuckets falhou:", error);
    throw new Error("Armazenamento de áudio indisponível.");
  }

  if (!buckets?.some((b) => b.name === BIOSITE_AUDIO_BUCKET)) {
    console.error(`[audioStorage] bucket "${BIOSITE_AUDIO_BUCKET}" não existe — provisione via migration/deploy.`);
    throw new Error("Armazenamento de áudio indisponível.");
  }

  bucketChecked = true;
}

/**
 * Sobe um áudio em base64 (data URL) pro Supabase Storage e devolve a URL
 * pública. Rejeita (lança) se o formato real não for permitido ou se passar
 * do limite de tamanho — o chamador (rota da API) decide como responder
 * isso ao cliente.
 */
export async function uploadAudioIfBase64(
  supabase: SupabaseClient,
  slug: string,
  value: string | undefined
): Promise<string | undefined> {
  // Não filtra mais por "data:audio" aqui (mesmo motivo do regex em
  // parseAudioDataUrl: o MIME declarado pode vir vazio/errado do
  // navegador) — só descarta o que claramente não é um data URL/já é uma
  // URL comum (link externo colado, ver "Usar link externo" no editor).
  if (!value || !value.startsWith("data:")) return value;

  const parsed = parseAudioDataUrl(value);

  await assertBucketExists(supabase);

  // Nome gerado no servidor (UUID), pasta derivada do slug sanitizado — o
  // cliente não escolhe nome nem extensão e não sobrescreve objeto existente.
  const path = `${safeSegment(slug, "sem-slug")}/musica-${randomUUID()}.${parsed.ext}`;
  const { error } = await supabase.storage.from(BIOSITE_AUDIO_BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: false,
  });
  if (error) {
    // Detalhe real só no log do servidor; cliente recebe mensagem genérica.
    console.error("[audioStorage] upload falhou:", error);
    throw new Error("Não foi possível salvar o áudio. Tente novamente.");
  }

  const { data } = supabase.storage.from(BIOSITE_AUDIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
