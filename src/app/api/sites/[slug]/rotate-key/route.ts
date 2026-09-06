import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { generateEditKey } from "@/lib/security";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { ToqySite } from "@/lib/types";

// Rotação de chave de edição (2026-09-06) — item §3.1 da auditoria
// externa: "a chave continua sendo uma credencial de edição; ela deve ter
// expiração, revogação, rotação e escopo de menor privilégio".
//
// Motivo concreto pra existir agora: em 2026-09-06 a chave de edição de
// todos os bio sites esteve exposta publicamente (ver src/lib/publicSite.ts).
// O vazamento foi fechado, mas chave copiada continua valendo — não há
// como saber quem copiou. Sem esta rota, a única remediação seria trocar
// tudo de uma vez e avisar cliente por cliente. Com ela, dá pra rotacionar
// um site específico na hora que precisar (cliente pediu, suspeita, ou
// simplesmente boa higiene).
//
// AUTENTICAÇÃO POR DONO, DE PROPÓSITO — não pela chave de edição.
// Se aceitasse a chave atual como prova, quem roubou a chave poderia
// rotacioná-la e TRANCAR O DONO PARA FORA do próprio bio site. Quem
// rotaciona tem que ser quem tem a conta.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;
  if (!slug) return Response.json({ ok: false, message: "Bio site obrigatório" }, { status: 400 });
  if (!hasSupabaseEnv()) return Response.json({ ok: false, message: "Servidor não configurado" }, { status: 500 });

  const supabase = getSupabaseAdmin()!;

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ ok: false, message: "Não autenticado" }, { status: 401 });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ ok: false, message: "Não autenticado" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `rotate-key:${auth.user.id}:${getClientIp(request)}`, 5, 60);
  if (!allowed) return Response.json({ ok: false, message: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("site_data, owner_profile_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!site || site.owner_profile_id !== auth.user.id) {
    return Response.json({ ok: false, message: "Você não tem acesso a este bio site." }, { status: 403 });
  }

  const novaChave = generateEditKey();

  // Os DOIS lugares precisam ser gravados juntos. `edit_key_hash` é o que
  // valida o login; `site_data.editKey` é o que a tela mostra pro dono
  // ("guarde sua chave"). Já aconteceu de os dois saírem de sincronia
  // nesta base — 16 de 55 bio sites ficaram com a chave exibida diferente
  // da que realmente funcionava, e o dono não conseguia entrar em /me
  // (corrigido em 2026-09-06). Por isso: uma escrita só, os dois campos.
  //
  // `edit_key_hash` recebe a chave em texto puro de propósito: o trigger
  // `hash_biosite_edit_key` no Postgres faz o bcrypt antes de gravar
  // (ver supabase/migrations). Escrever o hash aqui duplicaria essa regra.
  const { error } = await supabase
    .from("toqy_biosites")
    .update({
      edit_key_hash: novaChave,
      site_data: { ...(site.site_data as ToqySite), editKey: novaChave },
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) {
    console.error("[rotate-key] falha ao rotacionar chave de", slug, error);
    return Response.json({ ok: false, message: "Não foi possível gerar a nova chave." }, { status: 500 });
  }

  // A chave nova volta UMA vez, aqui. Depois disso ela só aparece pro dono
  // logado (/me e painel), nunca em superfície pública — ver toPublicSite().
  return Response.json({ ok: true, editKey: novaChave });
}
