import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

// Eventos de funil do módulo Placas (Fase 1.4) — conversão da landing e do
// wizard. Sem PII: só um session_key anônimo do navegador + tipo de evento
// + metadata leve. Best-effort: nunca falha a resposta por causa disso.
const ALLOWED_EVENTS = new Set([
  "landing_view",
  "click_individual",
  "click_reseller",
  "business_search",
  "business_selected",
  "product_selected",
  "checkout_started",
  "payment_approved",
  "order_shipped",
  "batch_viewed",
  "code_activated",
]);

const MAX_BODY = 2 * 1024;

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ ok: true });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return Response.json({ ok: true });
  const body = JSON.parse(raw || "{}") as { event?: string; sessionKey?: string; metadata?: unknown; profileId?: string };

  const event = String(body.event ?? "");
  if (!ALLOWED_EVENTS.has(event)) return Response.json({ ok: true });

  const supabase = getSupabaseAdmin()!;
  await supabase
    .from("toqy_plate_funnel_events")
    .insert({
      event_type: event,
      session_key: typeof body.sessionKey === "string" ? body.sessionKey.slice(0, 64) : null,
      profile_id: typeof body.profileId === "string" ? body.profileId : null,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : null,
    })
    .then(undefined, (e) => console.error("[api/plate/funnel]", e?.message));

  return Response.json({ ok: true });
}
