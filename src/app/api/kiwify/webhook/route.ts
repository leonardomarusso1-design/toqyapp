import { getSupabaseAdmin } from "@/lib/supabaseServer";

// Verificação leve de autenticidade — OPCIONAL, só entra em vigor se
// KIWIFY_WEBHOOK_TOKEN estiver configurada (sem isso, comportamento
// idêntico a antes). Sem essa verificação, qualquer um que descubra a URL
// pode POSTar um payload fingindo "order_approved" e liberar um plano pago
// pra qualquer e-mail de graça. Pra ativar: configurar KIWIFY_WEBHOOK_TOKEN
// nas envs E atualizar a URL do webhook no painel da Kiwify pra incluir
// "?token=SEU_SEGREDO".
const KIWIFY_WEBHOOK_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN;

function isAuthentic(request: Request) {
  if (!KIWIFY_WEBHOOK_TOKEN) return true;
  return new URL(request.url).searchParams.get("token") === KIWIFY_WEBHOOK_TOKEN;
}

function resolvePlan(productName: string): { plan: string; limit: number } | null {
  const n = productName.toLowerCase();
  if (n.includes("comunidade")) return { plan: "community", limit: 20 };
  if (n.includes("freelancer")) return { plan: "freelancer", limit: 20 };
  if (n.includes("agencia") || n.includes("agência")) return { plan: "agency", limit: 100 };
  return null;
}

type KiwifyPayload = {
  webhook_event_type?: string;
  order_status?: string;
  order_id?: string;
  Product?: { product_name?: string };
  Customer?: { email?: string; full_name?: string };
};

export async function POST(request: Request) {
  if (!isAuthentic(request)) return Response.json({ error: "Invalid token" }, { status: 401 });

  let body: KiwifyPayload = {};
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const eventType = body.webhook_event_type ?? "";
  const productName = body.Product?.product_name ?? "";
  const email = body.Customer?.email?.toLowerCase().trim() ?? "";
  const orderId = body.order_id ?? "";

  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  // Auditoria de todos os eventos recebidos
  await supabase.from("toqy_kiwify_events").insert({
    event_type: eventType, product_name: productName,
    customer_email: email, order_id: orderId, raw_payload: body,
  });

  const planInfo = resolvePlan(productName);
  if (!planInfo) return Response.json({ ok: true, skipped: "not_toqy_plan" });
  if (!email) return Response.json({ error: "No email" }, { status: 400 });

  const isApproved = eventType === "order_approved" || body.order_status === "paid";
  const isCanceled = eventType === "order_refunded" || eventType === "subscription_canceled";

  if (isApproved) {
    // Busca o usuário — tenta profiles primeiro, depois auth.users como fallback
    const { data: existingProfile } = await supabase
      .from("profiles").select("id, email").eq("email", email).maybeSingle();

    // Fallback: busca direto no auth.users se não achou em profiles
    let userId = existingProfile?.id;
    if (!userId) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email);
      userId = authUser?.id;
    }

    if (userId) {
      // Usuário existe → atualiza o plano direto
      await supabase.from("profiles").update({
        plan_toqy: planInfo.plan,
        biosites_limit: planInfo.limit,
        plan_toqy_since: new Date().toISOString(),
        plan_toqy_expires_at: null,
        kiwify_order_id_toqy: orderId,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      }).eq("id", userId);

      // Garante que o perfil existe (cria se necessário)
      await supabase.from("profiles").upsert({
        id: userId,
        email: email,
        plan_toqy: planInfo.plan,
        biosites_limit: planInfo.limit,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id", ignoreDuplicates: false });

      return Response.json({ ok: true, plan: planInfo.plan, applied: "immediate" });
    } else {
      // Usuário ainda não criou conta → grava plano pendente
      await supabase.from("toqy_pending_plans").upsert({
        email,
        plan_toqy: planInfo.plan,
        biosites_limit: planInfo.limit,
        kiwify_order_id: orderId,
      }, { onConflict: "email" });
      return Response.json({ ok: true, plan: planInfo.plan, applied: "pending" });
    }
  }

  if (isCanceled) {
    await supabase.from("profiles").update({
      plan_toqy: "free", biosites_limit: 1,
      plan_toqy_expires_at: new Date().toISOString(),
      subscription_status: "canceled", updated_at: new Date().toISOString(),
    }).eq("email", email);
    await supabase.from("toqy_pending_plans").delete().eq("email", email);
    return Response.json({ ok: true, downgraded: true });
  }

  return Response.json({ ok: true, skipped: eventType });
}
