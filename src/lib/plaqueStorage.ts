import type { SupabaseClient } from "@supabase/supabase-js";

// Mesmo padrão de imageStorage.ts (bucket dedicado, público, upload por
// base64) — separado do bucket de imagens de bio site porque são ativos
// com ciclo de vida diferente (uma arte gerada não pertence a nenhum bio
// site necessariamente).
export const PLAQUE_DESIGNS_BUCKET = "plaque-designs";

let bucketEnsured = false;

async function ensureBucket(supabase: SupabaseClient) {
  if (bucketEnsured) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === PLAQUE_DESIGNS_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(PLAQUE_DESIGNS_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
    });
  }
  bucketEnsured = true;
}

/**
 * Sobe uma imagem (base64 puro, sem prefixo data:) gerada pela IA pro
 * Supabase Storage e devolve a URL pública.
 */
export async function uploadPlaqueImage(
  supabase: SupabaseClient,
  ownerProfileId: string,
  base64OrBuffer: string | Buffer,
  mediaType: string
): Promise<string> {
  await ensureBucket(supabase);

  const ext = mediaType.split("/")[1] === "jpeg" ? "jpg" : mediaType.split("/")[1] || "png";
  const path = `${ownerProfileId}/${Date.now()}.${ext}`;
  const buffer = Buffer.isBuffer(base64OrBuffer) ? base64OrBuffer : Buffer.from(base64OrBuffer, "base64");

  const { error } = await supabase.storage.from(PLAQUE_DESIGNS_BUCKET).upload(path, buffer, {
    contentType: mediaType,
    upsert: true,
  });
  if (error) throw new Error(`Falha no upload da arte gerada: ${error.message}`);

  const { data } = supabase.storage.from(PLAQUE_DESIGNS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
