import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

// Fix de bug real (2026-07-16, achado ao fechar a auditoria de seguranca):
// o dashboard /app ("Meus bio sites") mostrava site.edit_key_hash como se
// fosse a chave em texto puro e montava o link de "Editar" com
// ?key=${edit_key_hash} — desde que o item 2 da auditoria virou esse campo
// num hash bcrypt de verdade, isso quebrou o proprio botao "Editar" do
// dono logado (a chave nunca bate no verify_biosite_key()).
//
// Em vez de expor qualquer coisa derivada de edit_key_hash no cliente de
// novo, esta rota deixa quem ja tem SESSAO e E DONO do bio site (confere
// owner_profile_id no servidor, service role) entrar direto no editor sem
// precisar da chave — mesma logica de /editar/[slug] pra quem recebeu o
// link com ?key=, so que autenticando por sessao em vez de chave.
async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  if (!slug) return Response.json({ ok: false, message: "Usuário obrigatório" }, { status: 400 });
  if (!hasSupabaseEnv()) return Response.json({ ok: false, message: "Servidor não configurado" }, { status: 500 });

  const supabase = getSupabaseAdmin()!;
  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ ok: false, message: "Não autenticado" }, { status: 401 });

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("site_data, slug, status, owner_profile_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!site || site.owner_profile_id !== userId) {
    return Response.json({ ok: false, message: "Você não tem acesso a este bio site." }, { status: 403 });
  }

  return Response.json({ ok: true, site: { ...(site.site_data as Record<string, unknown>), slug: site.slug, status: site.status } });
}
