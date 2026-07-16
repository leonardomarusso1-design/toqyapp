import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { findKiwifyAffiliateByEmail, setKiwifyAffiliateCommission, hasKiwifyApiEnv } from "@/lib/kiwifyApi";
import { RESELLER_TIERS, resolveResellerTier } from "@/lib/resellerTiers";

// Programa de indicação com comissão (2026-07-15) — botão "Sincronizar
// comissão" no painel. Chamado DEPOIS que o revendedor já se candidatou
// como afiliado na própria Kiwify (link público do produto, aprovação
// automática — ver comentário em kiwifyApi.ts). Busca o affiliate_id dele
// por e-mail e ajusta a comissão pro valor do tier atual (20%/30%).
// Idempotente: seguro chamar de novo (ex: depois de um upgrade de plano,
// pra recalcular a comissão).
async function getAuthenticatedUser(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return null;
  return { id: data.user.id, email: data.user.email };
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  if (!hasKiwifyApiEnv()) return Response.json({ error: "Integração com a Kiwify não configurada ainda" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const user = await getAuthenticatedUser(request, supabase);
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_toqy")
    .eq("id", user.id)
    .maybeSingle();

  const tier = resolveResellerTier(profile?.plan_toqy);
  if (!tier) return Response.json({ error: "Só assinantes Freelancer ou Agência participam do programa de indicação." }, { status: 403 });

  const affiliate = await findKiwifyAffiliateByEmail(user.email);
  if (!affiliate) {
    return Response.json({
      synced: false,
      message: "Ainda não encontramos você como afiliado na Kiwify. Candidate-se no link de afiliados do produto primeiro, depois tente sincronizar de novo.",
    });
  }

  const commissionPct = RESELLER_TIERS[tier].commissionPct;
  const updated = await setKiwifyAffiliateCommission(affiliate.affiliate_id, commissionPct);
  if (!updated) {
    return Response.json({ synced: false, message: "Encontramos seu cadastro de afiliado, mas não conseguimos ajustar a comissão agora. Tente de novo em instantes." });
  }

  await supabase
    .from("toqy_resellers")
    .update({ kiwify_affiliate_id: affiliate.affiliate_id, status: "active", commission_pct: commissionPct, activated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("profile_id", user.id);

  return Response.json({ synced: true, kiwify_affiliate_id: affiliate.affiliate_id, commission_pct: commissionPct });
}
