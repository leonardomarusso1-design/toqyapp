import { getSupabaseAdmin } from "@/lib/supabaseServer";

type VerifyBody = { edit_key?: string };

// Fix de segurança real (2026-07-17, auditoria): esta rota usava
// getBiositeBySlug()/validateClientKey() de @/lib/dataProvider, que
// reexporta do localProvider (baseado em window.localStorage) — rodando
// server-side, isso sempre retornava lista vazia, então a rota NUNCA
// validava um bio site real (sempre 404). Nesse meio tempo, /me e
// /editar/[slug] contornavam isso fazendo a checagem de chave DIRETO no
// navegador, via supabase.from("toqy_biosites").select("...edit_key_hash"),
// o que expunha a chave de edição (que nem é hash — texto puro, ver
// src/lib/security.ts) pra qualquer um antes mesmo da comparação acontecer.
// Pior: em /me, se o campo de usuário ficasse vazio, a busca rodava sem
// filtro de slug — vazava edit_key_hash de TODOS os bio sites ativos de
// uma vez, via RLS pública (que restringe linha, não coluna).
//
// Esta rota agora é a ÚNICA forma de verificar a chave: roda no servidor
// com o client admin (service role), exige slug (elimina a busca "sem
// filtro"), e a resposta NUNCA inclui edit_key_hash — só o site_data
// necessário pra carregar o editor depois de validado.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const editKey = body.edit_key?.trim();

  if (!slug) return Response.json({ ok: false, message: "Usuário obrigatório" }, { status: 400 });
  if (!editKey) return Response.json({ ok: false, message: "Chave obrigatória" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ ok: false, message: "Servidor não configurado" }, { status: 500 });

  // Comparação via RPC (2026-07-17) — edit_key_hash é bcrypt de verdade,
  // verify_biosite_key() compara no Postgres sem o hash passar pelo código.
  const { data: keyValid } = await supabase.rpc("verify_biosite_key", { p_slug: slug, p_key: editKey });

  // Mensagem genérica tanto pra "não existe" quanto pra "chave errada" —
  // não dar dica de qual dos dois é o motivo real.
  if (!keyValid) {
    return Response.json({ ok: false, message: "Usuário ou chave incorretos. Confira os dados que o criador enviou para você." }, { status: 401 });
  }

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("site_data, slug, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!site) return Response.json({ ok: false, message: "Usuário ou chave incorretos. Confira os dados que o criador enviou para você." }, { status: 401 });

  return Response.json({ ok: true, site: { ...(site.site_data as Record<string, unknown>), slug: site.slug, status: site.status } });
}
