import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { uploadImageIfBase64 } from "@/lib/imageStorage";

// Recebe uma imagem em base64 (já redimensionada no navegador pelo
// ImageUploadField) e sobe pro Supabase Storage, devolvendo um link público
// leve — em vez de deixar o base64 ir direto pro site_data (ver nota
// completa em src/lib/imageStorage.ts).
//
// Fix de segurança real (2026-07-17, auditoria): esta rota não tinha
// NENHUMA autenticação nem verificação de dono do slug — qualquer visitante
// anônimo podia subir arquivo pra qualquer slug (avatar de qualquer usuário,
// logo/fundo de qualquer bio site), consumindo Storage à vontade.
//
// Dois jeitos de provar acesso, mesmo padrão já usado em api/biosite/save:
// 1. Sessão Supabase (Authorization: Bearer) — usuário logado, dono do
//    recurso (avatar: slug === seu próprio id; bio site: slug pertence a um
//    toqy_biosites dele — OU o site ainda nem existe, caso de criação nova).
// 2. editKey no corpo — cliente externo sem conta, editando via
//    /editar/[slug]?key=..., mesma verificação de edit_key_hash que
//    api/biosite/save já faz.
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = await request.json().catch(() => null);
  const { dataUrl, slug, fieldId, editKey } = (body ?? {}) as { dataUrl?: string; slug?: string; fieldId?: string; editKey?: string };
  if (!dataUrl || !slug || !fieldId) {
    return Response.json({ error: "dataUrl, slug e fieldId são obrigatórios" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;

  const authorized = await isAuthorized(supabase, request, slug, fieldId, editKey);
  if (!authorized) return Response.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const url = await uploadImageIfBase64(supabase, slug, fieldId, dataUrl);
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erro no upload" }, { status: 500 });
  }
}

async function isAuthorized(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  request: Request,
  slug: string,
  fieldId: string,
  editKey?: string
): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (token) {
    const { data, error } = await supabase!.auth.getUser(token);
    const userId = error ? null : data.user?.id;
    if (userId) {
      // Avatar: só o próprio dono (fieldId="avatar", slug = profile.id — ver
      // configuracoes/page.tsx).
      if (fieldId === "avatar") return slug === userId;

      // Imagem de bio site: dono do site, OU site ainda não existe (fluxo
      // de criação — ver novo/page.tsx, usuário já provou estar logado
      // acima, e checkBiositeLimit() trava a criação em si depois).
      const { data: existing } = await supabase!
        .from("toqy_biosites")
        .select("owner_profile_id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) return true;
      return existing.owner_profile_id === userId;
    }
  }

  // Sem sessão válida — só resta a chave de edição (cliente externo).
  if (editKey) {
    const { data: existing } = await supabase!
      .from("toqy_biosites")
      .select("edit_key_hash")
      .eq("slug", slug)
      .maybeSingle();
    return Boolean(existing && existing.edit_key_hash === editKey.trim());
  }

  return false;
}
