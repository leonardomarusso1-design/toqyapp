import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { uploadAudioIfBase64 } from "@/lib/audioStorage";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Upload de música própria (2026-09-06) — mesmo padrão de autorização de
// /api/upload-image/route.ts (sessão dona do bio site, OU editKey do
// fluxo de edição sem conta). Ver src/lib/audioStorage.ts pro limite real
// de tamanho/duração.
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const { dataUrl, slug, editKey } = (body ?? {}) as { dataUrl?: string; slug?: string; editKey?: string };
  if (!dataUrl || !slug) {
    return Response.json({ error: "dataUrl e slug são obrigatórios" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;

  const allowed = await checkRateLimit(supabase, `upload-audio:${getClientIp(request)}`, 10, 60);
  if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  const authorized = await isAuthorized(supabase, request, slug, editKey);
  if (!authorized) return Response.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const url = await uploadAudioIfBase64(supabase, slug, dataUrl);
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erro no upload" }, { status: 500 });
  }
}

// Mesma lógica de autorização de upload-image/route.ts, sem o caso
// "avatar" (não se aplica a música) e sem o caso "site ainda não existe"
// (música só faz sentido depois que o bio site já existe, no editor).
async function isAuthorized(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  request: Request,
  slug: string,
  editKey?: string
): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (token) {
    const { data, error } = await supabase!.auth.getUser(token);
    const userId = error ? null : data.user?.id;
    if (userId) {
      const { data: existing } = await supabase!
        .from("toqy_biosites")
        .select("owner_profile_id")
        .eq("slug", slug)
        .maybeSingle();
      return existing?.owner_profile_id === userId;
    }
  }

  if (editKey) {
    const { data: keyValid } = await supabase!.rpc("verify_biosite_key", { p_slug: slug, p_key: editKey.trim() });
    return Boolean(keyValid);
  }

  return false;
}
