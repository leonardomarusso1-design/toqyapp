import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { generateResellerCode } from "@/lib/reseller";
import { PLAN_BIOSITE_LIMITS } from "@/lib/planLimits";

// Revenue Share — Agência (Fase 2 do roadmap, 2026-07-15) — vira revendedor
// gratuito com 1 clique, depois de logado. toqy_resellers não tem policy de
// INSERT/UPDATE client-side (ver supabase/migrations/
// 2026-07-16_agency_revenue_share.sql), então essa gravação precisa passar
// por uma rota com service role. Idempotente: seguro chamar de novo mesmo
// já sendo agency (só preenche reseller_code se ainda estiver null).
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

  if (profile?.plan_toqy !== "agency") {
    await supabase.from("profiles").update({
      plan_toqy: "agency",
      biosites_limit: PLAN_BIOSITE_LIMITS.agency,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }

  const { data: existing } = await supabase
    .from("toqy_resellers")
    .select("reseller_code, status")
    .eq("profile_id", userId)
    .maybeSingle();

  // profile_id é UNIQUE — se duas chamadas concorrentes caírem aqui juntas,
  // a segunda insert falha por conflito, mas o UPDATE de reseller_code
  // abaixo mira por profile_id (não pelo retorno do insert), então
  // continua funcionando mesmo nesse caso raro.
  if (!existing) {
    await supabase.from("toqy_resellers").insert({ profile_id: userId });
  }

  let resellerCode = existing?.reseller_code ?? null;
  const status = existing?.status ?? "pending_invite";

  if (!resellerCode) {
    // Tenta algumas vezes pra driblar colisão rara de unique constraint —
    // mesmo padrão de getOrCreateReferralCode() em referral.ts.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateResellerCode();
      const { error } = await supabase
        .from("toqy_resellers")
        .update({ reseller_code: code, updated_at: new Date().toISOString() })
        .eq("profile_id", userId);
      if (!error) { resellerCode = code; break; }
    }
    if (!resellerCode) return Response.json({ error: "Não foi possível gerar um código de revenda." }, { status: 500 });
  }

  return Response.json({ reseller_code: resellerCode, status });
}
