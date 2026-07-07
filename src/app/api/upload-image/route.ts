import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { uploadImageIfBase64 } from "@/lib/imageStorage";

// Recebe uma imagem em base64 (já redimensionada no navegador pelo
// ImageUploadField) e sobe pro Supabase Storage, devolvendo um link público
// leve — em vez de deixar o base64 ir direto pro site_data (ver nota
// completa em src/lib/imageStorage.ts).
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const { dataUrl, slug, fieldId } = (body ?? {}) as { dataUrl?: string; slug?: string; fieldId?: string };
  if (!dataUrl || !slug || !fieldId) {
    return Response.json({ error: "dataUrl, slug e fieldId são obrigatórios" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;
  try {
    const url = await uploadImageIfBase64(supabase, slug, fieldId, dataUrl);
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erro no upload" }, { status: 500 });
  }
}
