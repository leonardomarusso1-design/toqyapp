import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { getKiwifySale } from "@/lib/kiwifyApi";
import { resolvePlan, resolveOverageProduct, shouldDowngradeOnCancel, resolveAttributionStatus } from "./webhookLogic";
import { RESELLER_TIERS, resolveResellerTier } from "@/lib/resellerTiers";

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

  const isApproved = eventType === "order_approved" || body.order_status === "paid";
  const isCanceled = eventType === "order_refunded" || eventType === "subscription_canceled";

  // Cobrança de excedente avulsa (2026-07-17, pendência da Fase 2 do
  // roadmap) — roda ANTES de resolvePlan() de propósito: os nomes dos 2
  // produtos de overage nunca colidem com as substrings que resolvePlan()
  // reconhece (ver resolveOverageProduct() em webhookLogic.ts), mas checar
  // aqui primeiro deixa a intenção explícita e evita qualquer ambiguidade
  // futura se um nome de produto novo acabar batendo nos dois.
  const overageType = resolveOverageProduct(productName);
  if (overageType) {
    if (!isApproved) {
      // Reembolso/cancelamento de compra avulsa (R$2,99/R$5,99): não
      // decrementa automaticamente — valor baixo demais pra justificar essa
      // lógica extra; já fica no log de auditoria acima (linha 43-46) pro
      // raro caso precisar de tratamento manual.
      return Response.json({ ok: true, skipped: "overage_non_approved_event" });
    }
    if (!email) return Response.json({ error: "No email" }, { status: 400 });

    const { data: overageProfile } = await supabase
      .from("profiles")
      .select("id, overage_biosites, overage_ai_art_credits")
      .eq("email", email)
      .maybeSingle();

    // Sem fallback pra auth.admin.listUsers() nem toqy_pending_plans de
    // propósito: compra avulsa só faz sentido pra quem já está logado E já
    // bateu num limite real (já tem bio site ou já gerou arte) — ou seja,
    // já tem profiles row. "Não encontrado" aqui é edge case (e-mail
    // digitado errado no checkout), fica só logado pra reconciliação
    // manual, não vale construir infra de pending pra 1 coluna de inteiro.
    if (!overageProfile?.id) {
      await supabase.from("toqy_kiwify_events").insert({
        event_type: "overage_user_not_found",
        product_name: productName, customer_email: email, order_id: orderId,
        raw_payload: { note: "Compra avulsa aprovada sem profile correspondente ao e-mail — resolver manualmente." },
      });
      return Response.json({ ok: true, skipped: "overage_user_not_found" });
    }

    const column = overageType === "biosite" ? "overage_biosites" : "overage_ai_art_credits";
    const current = overageType === "biosite" ? (overageProfile.overage_biosites ?? 0) : (overageProfile.overage_ai_art_credits ?? 0);

    // Incrementa, nunca sobrescreve — mesmo padrão de referral_bonus_biosites
    // (ver bloco de comissão abaixo). NÃO toca em
    // plan_toqy/subscription_status/biosites_limit.
    await supabase.from("profiles")
      .update({ [column]: current + 1, updated_at: new Date().toISOString() })
      .eq("id", overageProfile.id);

    return Response.json({ ok: true, overage: overageType, applied: "immediate" });
  }

  const planInfo = resolvePlan(productName);
  if (!planInfo) return Response.json({ ok: true, skipped: "not_toqy_plan" });
  if (!email) return Response.json({ error: "No email" }, { status: 400 });

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

      // Programa de indicação com comissão (2026-07-15, substitui o desenho
      // "Agência grátis + revenda 30/70" — ver histórico em
      // subscriptions.ts) — relevante se o comprador for um cliente
      // gerenciado por um revendedor Freelancer ou Agência (não mais
      // restrito a Agência). Nunca deixa falha aqui quebrar o webhook
      // (plano já foi concedido acima) — qualquer erro só é logado pra
      // reconciliação manual.
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

            // Bônus de bio site (2026-07-15) — só na PRIMEIRA venda
            // registrada pra este cliente gerenciado (não em renovações
            // mensais) — checa ANTES do upsert pra não contar a própria
            // linha que estamos prestes a gravar. Tamanho do bônus (+1
            // Freelancer / +2 Agência) vem do plano ATUAL do revendedor no
            // momento da venda, não de quando ele entrou no programa.
            const { count: existingSalesCount } = await supabase
              .from("toqy_commission_ledger")
              .select("id", { count: "exact", head: true })
              .eq("managed_client_id", managedClient.id);
            const isFirstSaleForClient = (existingSalesCount ?? 0) === 0;

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

            if (isFirstSaleForClient) {
              // Soma em referral_bonus_biosites (mesma coluna do programa
              // geral de indicação, +3 fixo) — NÃO em biosites_limit
              // diretamente, que é sobrescrito (não somado) toda vez que o
              // plano do próprio revendedor renova (ver bloco isApproved
              // acima). planLimits.ts já soma biosites_limit +
              // referral_bonus_biosites pro limite real — reusar a mesma
              // coluna evita apagar o bônus na próxima renovação.
              const { data: resellerProfile } = await supabase
                .from("profiles")
                .select("plan_toqy, referral_bonus_biosites")
                .eq("id", managedClient.reseller_profile_id)
                .maybeSingle();
              const resellerTier = resolveResellerTier(resellerProfile?.plan_toqy);
              if (resellerTier) {
                const bonus = RESELLER_TIERS[resellerTier].bonusSites;
                await supabase.from("profiles")
                  .update({ referral_bonus_biosites: (resellerProfile?.referral_bonus_biosites ?? 0) + bonus })
                  .eq("id", managedClient.reseller_profile_id);
              }
            }
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
