import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, UploadValidationError, uploadVideoIfBase64 } from "@/lib/videoStorage";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Upload de vídeo de capa (2026-09-07, referência Coonexta) — mesmo padrão
// de autorização de /api/upload-audio/route.ts (sessão dona do bio site,
// OU editKey do fluxo de edição sem conta). Ver videoStorage.ts pro
// limite real de tamanho/duração.
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const { dataUrl, slug, editKey } = (body ?? {}) as { dataUrl?: string; slug?: string; editKey?: string };
  if (!dataUrl || !slug) {
    return Response.json({ error: "dataUrl e slug são obrigatórios" }, { status: 400 });
  }

  // Corte grosseiro antes de rate limit/autorização/decode — mesmo
  // raciocínio de upload-audio/route.ts.
  if (dataUrl.length > (MAX_VIDEO_BYTES * 4) / 3 + 1024) {
    return Response.json(
      { error: `Vídeo muito grande (máx. ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB, ~${MAX_VIDEO_SECONDS}s em baixa/média qualidade).` },
      { status: 413 }
    );
  }

  const supabase = getSupabaseAdmin()!;

  const allowed = await checkRateLimit(supabase, `upload-video:${getClientIp(request)}`, 10, 60);
  if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  const authorized = await isAuthorized(supabase, request, slug, editKey);
  if (!authorized) return Response.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const url = await uploadVideoIfBase64(supabase, slug, dataUrl);
    return Response.json({ url });
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("[upload-video] falha inesperada:", err);
    return Response.json({ error: "Não foi possível enviar o vídeo. Tente novamente." }, { status: 500 });
  }
}

// Mesma lógica de autorização de upload-audio/route.ts.
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
      // "!existing → true" (2026-09-08, bug real: fundo em vídeo é
      // configurável na etapa Aparência, a MESMA etapa da criação —
      // igual upload-image já fazia). Sem isso, subir um vídeo de capa
      // ANTES do primeiro "Salvar" (site ainda não gravado em
      // toqy_biosites) sempre dava 401, pra qualquer usuário.
      const { data: existing } = await supabase!
        .from("toqy_biosites")
        .select("owner_profile_id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) return true;
      return existing.owner_profile_id === userId;
    }
  }

  if (editKey) {
    const { data: keyValid } = await supabase!.rpc("verify_biosite_key", { p_slug: slug, p_key: editKey.trim() });
    return Boolean(keyValid);
  }

  return false;
}
