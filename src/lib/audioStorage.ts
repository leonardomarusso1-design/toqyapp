import type { SupabaseClient } from "@supabase/supabase-js";

// Música própria hospedada no Toqy (2026-09-06, pedido do Leonardo:
// "hospedar as músicas que ela tem baixado no pc ou celular, no próprio
// Toqy" — antes disso o campo só aceitava um link externo). Mesmo padrão
// de src/lib/imageStorage.ts (upload de base64 pro Supabase Storage,
// devolve URL pública) — bucket e limite de tamanho diferentes.

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

let bucketEnsured = false;

async function ensureBucket(supabase: SupabaseClient) {
  if (bucketEnsured) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BIOSITE_AUDIO_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BIOSITE_AUDIO_BUCKET, {
      public: true,
      fileSizeLimit: "4MB",
    });
  }
  bucketEnsured = true;
}

function parseAudioDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const match = /^data:(audio\/(\w+));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const ext = match[2] === "mpeg" ? "mp3" : match[2];
  const buffer = Buffer.from(match[3], "base64");
  return { buffer, contentType, ext };
}

/**
 * Sobe um áudio em base64 (data URL) pro Supabase Storage e devolve a URL
 * pública. Rejeita (lança) se passar do limite de tamanho — o chamador
 * (rota da API) decide como responder isso ao cliente.
 */
export async function uploadAudioIfBase64(
  supabase: SupabaseClient,
  slug: string,
  value: string | undefined
): Promise<string | undefined> {
  if (!value || !value.startsWith("data:audio")) return value;

  const parsed = parseAudioDataUrl(value);
  if (!parsed) throw new Error("Formato de áudio não reconhecido. Envie um mp3, ogg ou wav.");
  if (parsed.buffer.byteLength > MAX_AUDIO_BYTES) {
    throw new Error(`Áudio muito grande (máx. ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB, ~${MAX_AUDIO_SECONDS}s em boa qualidade).`);
  }

  await ensureBucket(supabase);

  const path = `${slug}/musica-${Date.now()}.${parsed.ext}`;
  const { error } = await supabase.storage.from(BIOSITE_AUDIO_BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: true,
  });
  if (error) throw new Error(`Falha no upload do áudio: ${error.message}`);

  const { data } = supabase.storage.from(BIOSITE_AUDIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
