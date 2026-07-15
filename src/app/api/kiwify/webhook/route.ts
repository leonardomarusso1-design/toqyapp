import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { getKiwifySale } from "@/lib/kiwifyApi";
import { resolvePlan, shouldDowngradeOnCancel, resolveAttributionStatus } from "./webhookLogic";

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

      // Programa de indicação (2026-07-16) — se este usuário foi indicado
      // por alguém E essa indicação ainda não foi recompensada, quem
      // indicou ganha +3 bio sites agora, no PRIMEIRO pagamento aprovado
      // do indicado (nunca de novo em renovações — checa toqy_referrals
      // .rewarded antes, update só acontece uma vez por causa da condição
      // .eq("rewarded", false) no update abaixo).
      const { data: referral } = await supabase
        .from("toqy_referrals")
        .select("id, referrer_profile_id, rewarded")
        .eq("referred_profile_id", userId)
        .maybeSingle();

      if (referral && !referral.rewarded) {
        const { data: updatedReferral } = await supabase
          .from("toqy_referrals")
          .update({ converted_at: new Date().toISOString(), rewarded: true })
          .eq("id", referral.id)
          .eq("rewarded", false)
          .select()
          .maybeSingle();

        if (updatedReferral) {
          const { data: referrerProfile } = await supabase
            .from("profiles").select("referral_bonus_biosites").eq("id", referral.referrer_profile_id).maybeSingle();
          await supabase.from("profiles")
            .update({ referral_bonus_biosites: (referrerProfile?.referral_bonus_biosites ?? 0) + 3 })
            .eq("id", referral.referrer_profile_id);
        }
      }

      // Comissão de revenda (Fase 2 do roadmap, 2026-07-16) — só relevante
      // se o comprador for um cliente gerenciado por um revendedor Agência.
      // Nunca deixa falha aqui quebrar o webhook (plano já foi concedido
      // acima) — qualquer erro só é logado pra reconciliação manual.
      try {
        const { data: managedClient } = await supabase
          .from("toqy_managed_clients")
          .select("id, reseller_profile_id")
          .eq("client_profile_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (managedClient && orderId) {
          const { data: reseller } = await supabase
            .from("toqy_resellers")
            .select("kiwify_affiliate_id")
            .eq("profile_id", managedClient.reseller_profile_id)
            .maybeSingle();

          const saleDetail = await getKiwifySale(orderId);
          if (saleDetail?.affiliate_commission) {
            const attributionStatus = resolveAttributionStatus(
              reseller?.kiwify_affiliate_id,
              saleDetail.affiliate_commission.id
            );

            await supabase.from("toqy_commission_ledger").upsert({
              managed_client_id: managedClient.id,
              reseller_profile_id: managedClient.reseller_profile_id,
              client_profile_id: userId,
              kiwify_order_id: orderId,
              kiwify_affiliate_id: saleDetail.affiliate_commission.id ?? null,
              product_name: productName,
              sale_amount_cents: saleDetail.amount ?? null,
              commission_amount_cents: saleDetail.affiliate_commission.amount ?? null,
              event_type: eventType,
              attribution_status: attributionStatus,
              raw_sale_detail: saleDetail,
              occurred_at: new Date().toISOString(),
            }, { onConflict: "kiwify_order_id" });
          }
        }
      } catch (err) {
        await supabase.from("toqy_kiwify_events").insert({
          event_type: "commission_attribution_failed",
          product_name: productName, customer_email: email, order_id: orderId,
          raw_payload: { error: String(err) },
        });
      }

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
    // Fase 1 do roadmap (2026-07-16): checar acesso vitalício legado ANTES
    // de rebaixar — ver shouldDowngradeOnCancel() em webhookLogic.ts.
    const { data: profileForCheck } = await supabase
      .from("profiles")
      .select("legacy_lifetime_access")
      .eq("email", email)
      .maybeSingle();

    if (!shouldDowngradeOnCancel(profileForCheck)) {
      await supabase.from("toqy_kiwify_events").insert({
        event_type: `${eventType}_ignored_legacy_lifetime_access`,
        product_name: productName, customer_email: email, order_id: orderId,
        raw_payload: { note: "Downgrade ignorado: perfil tem legacy_lifetime_access=true" },
      });
      return Response.json({ ok: true, downgraded: false, reason: "legacy_lifetime_access" });
    }

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
