import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

// Reconciliação de plano pendente (2026-09-01, movida pra cá na mesma
// auditoria que travou plan_toqy/biosites_limit/etc em `profiles` só pra
// service_role — ver migration protect_profile_plan_columns). Antes, o
// AuthSync.tsx escrevia essas colunas direto do client (sessão do próprio
// usuário) — funcionava, mas exigia deixar a policy de UPDATE aberta o
// bastante pra qualquer usuário se autopromover de plano sozinho. Esta rota
// concentra a ÚNICA forma segura de aplicar um plano comprado antes da
// conta existir (toqy_pending_plans): roda com service role, mas só aplica
// pro EMAIL do próprio usuário autenticado (nunca aceita email arbitrário
// do corpo da requisição).
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ ok: false, error: "Servidor não configurado" }, { status: 500 });

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  const supabase = getSupabaseAdmin()!;
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ ok: false, error: "Sessão inválida" }, { status: 401 });

  const userId = userData.user.id;
  const email = userData.user.email?.toLowerCase().trim();
  if (!email) return Response.json({ ok: true, applied: false });

  const { data: pending } = await supabase
    .from("toqy_pending_plans")
    .select("plan_toqy, biosites_limit")
    .eq("email", email)
    .maybeSingle();

  if (!pending) return Response.json({ ok: true, applied: false });

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      plan_toqy: pending.plan_toqy,
      biosites_limit: pending.biosites_limit,
      plan_toqy_since: new Date().toISOString(),
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[plans/reconcile] update error:", updateError.message);
    return Response.json({ ok: false, error: "Falha ao aplicar plano" }, { status: 500 });
  }

  await supabase.from("toqy_pending_plans").delete().eq("email", email);

  return Response.json({ ok: true, applied: true, plan: pending.plan_toqy });
}
