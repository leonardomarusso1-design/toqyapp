import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { RESELLER_TIERS, resolveResellerTier } from "@/lib/resellerTiers";

// Programa de indicação com comissão (2026-07-15) — "a pessoa que vier
// ganha desconto em qualquer plano". Precisa de rota com service role
// porque RLS de profiles só deixa cada um ler o PRÓPRIO plano — o cliente
// referido não consegue ler o plan_toqy do revendedor que o indicou
// direto do client pra saber qual cupom (10%/15%) se aplica.
async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

const EMPTY = { couponCode: null, kiwifyAffiliateId: null };

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) return Response.json(EMPTY);
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json(EMPTY);

  const { data: managedClient } = await supabase
    .from("toqy_managed_clients")
    .select("reseller_profile_id")
    .eq("client_profile_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!managedClient) return Response.json(EMPTY);

  const [{ data: resellerProfile }, { data: reseller }] = await Promise.all([
    supabase.from("profiles").select("plan_toqy").eq("id", managedClient.reseller_profile_id).maybeSingle(),
    // Comissão de afiliado de verdade (2026-07-17, ver applyResellerAttribution
    // em resellerTiers.ts) — só existe kiwify_affiliate_id aqui DEPOIS que o
    // revendedor rodou "Sincronizar comissão" pelo menos uma vez (status
    // "active" em toqy_resellers). Se ainda não sincronizou, devolve null e o
    // link cai de volta pro comportamento de antes (só cupom, sem afid) — a
    // Kiwify não aceitaria um afid de afiliado que não existe/não está ativo.
    supabase.from("toqy_resellers").select("kiwify_affiliate_id, status").eq("profile_id", managedClient.reseller_profile_id).maybeSingle(),
  ]);

  const tier = resolveResellerTier(resellerProfile?.plan_toqy);
  return Response.json({
    couponCode: tier ? RESELLER_TIERS[tier].kiwifyCouponCode : null,
    kiwifyAffiliateId: reseller?.status === "active" ? (reseller.kiwify_affiliate_id ?? null) : null,
  });
}
