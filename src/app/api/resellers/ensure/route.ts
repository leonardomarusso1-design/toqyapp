import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { generateResellerCode } from "@/lib/reseller";
import { RESELLER_TIERS, resolveResellerTier } from "@/lib/resellerTiers";

// Programa de indicação com comissão (2026-07-15) — chamado automaticamente
// pelo painel (/app/revenda) ao carregar. Diferente do antigo
// /api/resellers/join (removido): não promove ninguém de plano — só
// garante que quem JÁ é Freelancer ou Agência pagante tem um
// toqy_resellers + reseller_code prontos, e devolve a configuração do
// tier atual (comissão/desconto/bônus). Reller_code não muda quando o
// plano muda; a configuração de recompensa sim (recalculada aqui a cada
// chamada, a partir do plan_toqy ATUAL).
async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_toqy")
    .eq("id", userId)
    .maybeSingle();

  const tier = resolveResellerTier(profile?.plan_toqy);
  if (!tier) return Response.json({ eligible: false });

  const { data: existing } = await supabase
    .from("toqy_resellers")
    .select("reseller_code, status, kiwify_affiliate_id")
    .eq("profile_id", userId)
    .maybeSingle();

  // profile_id é UNIQUE — corrida rara entre 2 chamadas concorrentes só
  // falha o insert da segunda (constraint), sem quebrar o fluxo: a leitura
  // de reseller_code abaixo mira por profile_id, não pelo retorno do insert.
  if (!existing) {
    const { error: insertErr } = await supabase.from("toqy_resellers").insert({ profile_id: userId, commission_pct: RESELLER_TIERS[tier].commissionPct });
    if (insertErr) console.error("[resellers/ensure] insert failed:", insertErr);
  } else {
    // Mantém commission_pct em dia se o plano mudou de tier desde a última
    // chamada (ex: Freelancer virou Agência) — só o número aqui, o valor
    // real na Kiwify só muda quando /api/resellers/sync-affiliate roda.
    await supabase.from("toqy_resellers").update({ commission_pct: RESELLER_TIERS[tier].commissionPct }).eq("profile_id", userId);
  }

  let resellerCode = existing?.reseller_code ?? null;
  if (!resellerCode) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateResellerCode();
      const { error } = await supabase
        .from("toqy_resellers")
        .update({ reseller_code: code, updated_at: new Date().toISOString() })
        .eq("profile_id", userId);
      if (!error) { resellerCode = code; break; }
      console.error("[resellers/ensure] reseller_code update attempt failed:", error);
    }
    if (!resellerCode) return Response.json({ error: "Não foi possível gerar um código de indicação." }, { status: 500 });
  }

  return Response.json({
    eligible: true,
    tier,
    reseller_code: resellerCode,
    status: existing?.status ?? "pending_invite",
    kiwify_affiliate_id: existing?.kiwify_affiliate_id ?? null,
    tierConfig: RESELLER_TIERS[tier],
  });
}
