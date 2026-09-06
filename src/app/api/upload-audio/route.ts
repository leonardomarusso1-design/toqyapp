import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS, UploadValidationError, uploadAudioIfBase64 } from "@/lib/audioStorage";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Upload de música própria (2026-09-06) — mesmo padrão de autorização de
// /api/upload-image/route.ts (sessão dona do bio site, OU editKey do
// fluxo de edição sem conta). Ver src/lib/audioStorage.ts pro limite real
// de tamanho/duração.
//
// Fix de segurança (2026-09-06, auditoria externa): validação de conteúdo
// (magic bytes, allowlist, teto antes do decode) fica em audioStorage.ts.
// Aqui a mudança é o tratamento de erro — `err.message` era devolvido cru
// ao cliente, repassando mensagem interna do Supabase Storage.
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const { dataUrl, slug, editKey } = (body ?? {}) as { dataUrl?: string; slug?: string; editKey?: string };
  if (!dataUrl || !slug) {
    return Response.json({ error: "dataUrl e slug são obrigatórios" }, { status: 400 });
  }

  // Corte grosseiro antes de rate limit/autorização/decode: 4 caracteres
  // base64 = 3 bytes, então a string nunca precisa passar de ~4/3 do limite
  // (+ margem pro prefixo "data:audio/...;base64,").
  if (dataUrl.length > (MAX_AUDIO_BYTES * 4) / 3 + 1024) {
    return Response.json(
      { error: `Áudio muito grande (máx. ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB, ~${MAX_AUDIO_SECONDS}s em boa qualidade).` },
      { status: 413 }
    );
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
    // Mensagem de UploadValidationError é nossa e orienta o usuário
    // ("envie um mp3, m4a, ogg ou wav") — pode ir pro cliente.
    if (err instanceof UploadValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("[upload-audio] falha inesperada:", err);
    return Response.json({ error: "Não foi possível enviar o áudio. Tente novamente." }, { status: 500 });
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
