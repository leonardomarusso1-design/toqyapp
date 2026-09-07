import { getSupabaseAdmin } from "@/lib/supabaseServer";

// Reversão automática de acesso temporário (2026-09-06) — criado pro
// primeiro caso real: Leonardo liberou o plano Agência pro Guilbert
// (contato.guilbertmkt@gmail.com) por 2 semanas de teste, via
// `plan_toqy_expires_at` + `subscription_status = 'trialing'`. Essa coluna
// já existia (usada até então só como carimbo de "quando foi cancelado"),
// mas NADA lia ela pra reverter automaticamente — sem este cron, o acesso
// temporário nunca teria expirado sozinho. Reutilizável pra qualquer
// próximo trial manual, não é específico do Guilbert.
//
// Agendado via `vercel.json` (crons), roda 1x/dia. Protegido por
// CRON_SECRET pra ninguém além da Vercel conseguir chamar essa rota.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  // Só reverte quem está EXPLICITAMENTE em teste temporário
  // (subscription_status='trialing') e cuja data já passou — nunca mexe
  // em assinante pagante de verdade (esses usam outro fluxo, o webhook
  // da Kiwify, que nunca seta 'trialing').
  const { data: expired, error: selectError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("subscription_status", "trialing")
    .lt("plan_toqy_expires_at", new Date().toISOString());

  if (selectError) return Response.json({ error: selectError.message }, { status: 500 });
  if (!expired?.length) return Response.json({ ok: true, downgraded: 0 });

  const ids = expired.map((p) => p.id);
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan_toqy: "free", plan_tier: "free", biosites_limit: 1, subscription_status: "active", updated_at: new Date().toISOString() })
    .in("id", ids);

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

  for (const p of expired) {
    if (p.email) await sendTrialEndedEmail(p.email);
  }

  return Response.json({ ok: true, downgraded: expired.length });
}

async function sendTrialEndedEmail(to: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Toqy <noreply@toqy.com.br>",
        to: [to],
        subject: "Seu teste do plano Agência no Toqy terminou",
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2>Seu teste de 2 semanas terminou</h2>
          <p>Sua conta Toqy voltou pro plano Gratuito. Se quiser continuar com os recursos do plano Agência (até 100 bio sites, domínio próprio, analytics avançado), é só assinar:</p>
          <p><a href="https://toqy.com.br/#planos" style="display:inline-block;background:#0b7a55;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">Ver planos</a></p>
        </div>`,
      }),
    });
  } catch (err) {
    console.error("[cron/expire-trials] falha ao enviar email de fim de teste:", err);
  }
}
