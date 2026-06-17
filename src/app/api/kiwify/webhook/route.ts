import { getSupabaseAdmin } from "@/lib/supabaseServer";

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
  let body: KiwifyPayload = {};
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const eventType = body.webhook_event_type ?? "";
  const productName = body.Product?.product_name ?? "";
  const email = body.Customer?.email?.toLowerCase().trim() ?? "";
  const orderId = body.order_id ?? "";

  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  // Auditoria
  await supabase.from("toqy_kiwify_events").insert({ event_type: eventType, product_name: productName, customer_email: email, order_id: orderId, raw_payload: body });

  const planInfo = resolvePlan(productName);
  if (!planInfo) return Response.json({ ok: true, skipped: "not_toqy_plan" });
  if (!email) return Response.json({ error: "No email" }, { status: 400 });

  const isApproved = eventType === "order_approved" || body.order_status === "paid";
  const isCanceled = eventType === "order_refunded" || eventType === "subscription_canceled";

  if (isApproved) {
    await supabase.from("profiles").upsert({
      email,
      full_name: body.Customer?.full_name ?? "",
      plan_toqy: planInfo.plan,
      biosites_limit: planInfo.limit,
      plan_toqy_since: new Date().toISOString(),
      plan_toqy_expires_at: null,
      kiwify_order_id_toqy: orderId,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    }, { onConflict: "email", ignoreDuplicates: false });
    return Response.json({ ok: true, plan: planInfo.plan, email });
  }

  if (isCanceled) {
    await supabase.from("profiles").update({ plan_toqy: "free", biosites_limit: 1, plan_toqy_expires_at: new Date().toISOString(), subscription_status: "canceled", updated_at: new Date().toISOString() }).eq("email", email);
    return Response.json({ ok: true, downgraded: true, email });
  }

  return Response.json({ ok: true, skipped: eventType });
}
