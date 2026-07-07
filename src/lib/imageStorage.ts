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

export const BIOSITE_IMAGES_BUCKET = "biosite-images";

let bucketEnsured = false;

async function ensureBucket(supabase: SupabaseClient) {
  if (bucketEnsured) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BIOSITE_IMAGES_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BIOSITE_IMAGES_BUCKET, {
      public: true,
      fileSizeLimit: "8MB",
    });
  }
  bucketEnsured = true;
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const match = /^data:(image\/(\w+));base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const ext = match[2] === "jpeg" ? "jpg" : match[2];
  const buffer = Buffer.from(match[3], "base64");
  return { buffer, contentType, ext };
}

/**
 * Sobe uma imagem em base64 (data URL) pro Supabase Storage e devolve a URL
 * pública. Se `value` não for um data URL de imagem (já é uma URL normal, ou
 * está vazio), devolve o próprio valor sem fazer nada — idempotente, seguro
 * pra chamar em qualquer campo sem checar antes se precisa migrar.
 */
export async function uploadImageIfBase64(
  supabase: SupabaseClient,
  slug: string,
  fieldId: string,
  value: string | undefined
): Promise<string | undefined> {
  if (!value || !value.startsWith("data:image")) return value;

  const parsed = parseDataUrl(value);
  if (!parsed) return value; // formato inesperado — não derruba o fluxo, mantém como estava

  await ensureBucket(supabase);

  const path = `${slug}/${fieldId}-${Date.now()}.${parsed.ext}`;
  const { error } = await supabase.storage.from(BIOSITE_IMAGES_BUCKET).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: true,
  });
  if (error) throw new Error(`Falha no upload de ${fieldId}: ${error.message}`);

  const { data } = supabase.storage.from(BIOSITE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
