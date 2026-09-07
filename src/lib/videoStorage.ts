import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UploadValidationError } from "./imageStorage";

// Capa em vídeo (2026-09-07, referência Coonexta — vídeo do Leonardo:
// "coloquei um vídeo no banner, olha que coisa mais linda"). Mesmo padrão
// de audioStorage.ts: upload de base64 pro Supabase Storage, devolve URL
// pública, magic bytes decidem o formato real (nunca o MIME declarado).
export { UploadValidationError };

export const BIOSITE_VIDEO_BUCKET = "biosite-video";

// Mesmo teto real de audioStorage.ts: Vercel Functions aceita ~4,5MB por
// corpo de requisição (não configurável no plano do Leonardo), e o upload
// chega em base64 (~33% maior que o arquivo). 3,5MB de arquivo cobre
// alguns segundos de vídeo curto em qualidade baixa/média — o bastante
// pra um "cinemagraph" de capa, não pra um vídeo longo. Quem tem um
// vídeo maior já hospedado (Drive, YouTube não-embed, CDN próprio) usa o
// campo de link externo, sem esse limite.
export const MAX_VIDEO_BYTES = 3.5 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 12;

const VIDEO_CONTENT_TYPE = { mp4: "video/mp4", webm: "video/webm" } as const;
type AllowedVideoExt = keyof typeof VIDEO_CONTENT_TYPE;

/**
 * Identifica o formato real pelos primeiros bytes — mesmo raciocínio de
 * detectAudioExt em audioStorage.ts: o MIME do data URL é escolhido pelo
 * cliente e não prova nada.
 */
function detectVideoExt(buffer: Buffer): AllowedVideoExt | null {
  if (buffer.length < 12) return null;

  // MP4/MOV: container ISO-BMFF — "ftyp" no offset 4.
  if (buffer.toString("ascii", 4, 8) === "ftyp") return "mp4";

  // WebM: container Matroska/EBML, assinatura fixa 1A 45 DF A3.
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return "webm";

  return null;
}

function approxDecodedBytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4);
}

function safeSegment(value: string, fallback: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || fallback;
}

const SIZE_ERROR = `Vídeo muito grande (máx. ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB, ~${MAX_VIDEO_SECONDS}s em baixa/média qualidade).`;

function parseVideoDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: AllowedVideoExt } {
  const match = /^data:video\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) throw new UploadValidationError("Formato de vídeo não reconhecido. Envie um mp4 ou webm.");

  const base64 = match[2];
  if (approxDecodedBytes(base64) > MAX_VIDEO_BYTES) throw new UploadValidationError(SIZE_ERROR);

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_VIDEO_BYTES) throw new UploadValidationError(SIZE_ERROR);

  const ext = detectVideoExt(buffer);
  if (!ext) throw new UploadValidationError("O arquivo enviado não é um vídeo válido. Envie um mp4 ou webm.");

  return { buffer, contentType: VIDEO_CONTENT_TYPE[ext], ext };
}

let bucketChecked = false;

/**
 * Confere que o bucket existe — e NÃO cria se faltar (mesma regra de
 * audioStorage.ts): criar bucket é tarefa de migration/deploy, não de
 * requisição de usuário.
 */
async function assertBucketExists(supabase: SupabaseClient) {
  if (bucketChecked) return;

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("[videoStorage] listBuckets falhou:", error);
    throw new Error("Armazenamento de vídeo indisponível.");
  }

  if (!buckets?.some((b) => b.name === BIOSITE_VIDEO_BUCKET)) {
    console.error(`[videoStorage] bucket "${BIOSITE_VIDEO_BUCKET}" não existe — provisione via migration/deploy.`);
    throw new Error("Armazenamento de vídeo indisponível.");
  }

  bucketChecked = true;
}

/**
 * Sobe um vídeo em base64 (data URL) pro Supabase Storage e devolve a URL
 * pública. Rejeita (lança) se o formato real não for permitido ou se
 * passar do limite de tamanho.
 */
export async function uploadVideoIfBase64(
  supabase: SupabaseClient,
  slug: string,
  value: string | undefined
): Promise<string | undefined> {
  if (!value || !value.startsWith("data:video")) return value;

  const parsed = parseVideoDataUrl(value);

  await assertBucketExists(supabase);

  const path = `${safeSegment(slug, "sem-slug")}/capa-${randomUUID()}.${parsed.ext}`;
  const { error } = await supabase.storage.from(BIOSITE_VIDEO_BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: false,
  });
  if (error) {
    console.error("[videoStorage] upload falhou:", error);
    throw new Error("Não foi possível salvar o vídeo. Tente novamente.");
  }

  const { data } = supabase.storage.from(BIOSITE_VIDEO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
