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

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ couponCode: null });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ couponCode: null });

  const { data: managedClient } = await supabase
    .from("toqy_managed_clients")
    .select("reseller_profile_id")
    .eq("client_profile_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!managedClient) return Response.json({ couponCode: null });

  const { data: resellerProfile } = await supabase
    .from("profiles")
    .select("plan_toqy")
    .eq("id", managedClient.reseller_profile_id)
    .maybeSingle();

  const tier = resolveResellerTier(resellerProfile?.plan_toqy);
  return Response.json({ couponCode: tier ? RESELLER_TIERS[tier].kiwifyCouponCode : null });
}
