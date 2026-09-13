"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { KIWIFY_LINKS, PlanType, resolvePlanTier, SUBSCRIPTION_PLANS } from "@/lib/subscriptions";
import { applyResellerAttribution } from "@/lib/resellerTiers";
import { supabase } from "@/lib/supabaseClient";

// ============================================================
// Página obrigatória de checkout (2026-09-12)
//
// Antes desta página existir, qualquer visitante clicava direto
// no link da Kiwify sem precisar de login. Isso gerava 2 bugs
// recorrentes de produção:
//
// BUG A: Compra com email DIFERENTE da conta → plano não é
//   ativado automaticamente, fica em pending plan ou nunca
//   encontra o profile (ex: lucasxmarciel@gmail.com comprou
//   Freelancer primeiro e criou conta depois — nesse caso em
//   específico o sistema de pending existe, mas se o usuário
//   digitar um email COMPLETAMENTE diferente na Kiwify, nunca
//   é ligado à conta).
//
// BUG B: Plano Pro (R$9,90) nem era aceito pela constraint CHECK
//   do banco (corrigido em migration), mas somando-se ao bug A,
//   usuários nunca ativavam (caimanplatina@gmail.com e outros).
//
// SOLUÇÃO: Obrigar login ANTES de acessar o checkout da Kiwify,
// mostrar o email da conta LOGADO em DESTAQUE e exigir que o
// usuário CONFIRME que vai usar exatamente esse email na Kiwify.
// Também passamos o email pré-preenchido na query string da
// Kiwify (?email=) para reduzir erro humano de digitação.
// ============================================================

type CouponInfo = { couponCode: string | null; kiwifyAffiliateId: string | null };

export default function CheckoutPlanPage({ params, searchParams }: { params: { plan: string }; searchParams?: { plan?: string } }) {
  const router = useRouter();
  // Aceita DOIS formatos:
  //   1) /checkout/pro          → route param (padrão novo, nossos links)
  //   2) /checkout?plan=pro     → query string (formato antigo que veio do
  //      origin/master; a página é /checkout/[plan] com plan="algum-valor"
  //      mas o Next.js também aceita ?plan= se a url for /checkout/_?plan=pro —
  //      ou seja, se o root /checkout tiver um segmento coringa. Buscamos
  //      também via searchParams para cobrir qualquer formato.)
  const rawPlan = searchParams?.plan && searchParams.plan !== params.plan && params.plan === "_"
    ? searchParams.plan
    : searchParams?.plan || params.plan;
  const planId = resolvePlanTier(rawPlan === "pro" ? "pro" : rawPlan) as PlanType;

  const isPlanValid = planId !== "free" && planId in KIWIFY_LINKS;
  const planInfo = isPlanValid ? SUBSCRIPTION_PLANS[planId] : null;
  const kiwifyBaseUrl = isPlanValid ? (KIWIFY_LINKS as Record<string, string>)[planId] : null;

  const [loading, setLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState<{ id: string; email: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [coupon, setCoupon] = useState<CouponInfo>({ couponCode: null, kiwifyAffiliateId: null });
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function boot() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user?.email) {
        // Não logado → volta pro login com redirect de volta pra cá.
        // Monta a URL de volta incluindo route param E query string,
        // para não perder o plano se o usuário chegou por /checkout?plan=xxx.
        const backTo = searchParams?.plan && searchParams.plan !== params.plan
          ? `/checkout/${encodeURIComponent(params.plan)}?plan=${encodeURIComponent(searchParams.plan)}`
          : `/checkout/${encodeURIComponent(rawPlan)}`;
        const redirect = encodeURIComponent(backTo);
        router.replace(`/login?next=${redirect}`);
        return;
      }

      const email = session.user.email;
      setLoggedUser({ id: session.user.id, email });

      // Carrega cupom/afiliado do revendedor (igual na página de configurações)
      let couponRes: CouponInfo = { couponCode: null, kiwifyAffiliateId: null };
      try {
        const r = await fetch("/api/resellers/my-coupon", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await r.json().catch(() => ({}));
        couponRes = {
          couponCode: json?.couponCode ?? null,
          kiwifyAffiliateId: json?.kiwifyAffiliateId ?? null,
        };
      } catch {}
      if (!active) return;
      setCoupon(couponRes);

      if (kiwifyBaseUrl) {
        // Passa ?email= na URL da Kiwify para PRÉ-PREENCHER o email
        // no checkout — reduz drasticamente erro humano de digitar
        // um email diferente da conta Toqy.
        const urlWithEmail = new URL(kiwifyBaseUrl);
        urlWithEmail.searchParams.set("email", email);
        const final = applyResellerAttribution(
          urlWithEmail.toString(),
          couponRes.couponCode,
          couponRes.kiwifyAffiliateId
        );
        setCheckoutUrl(final);
      }
      setLoading(false);
    }
    boot();
    return () => { active = false; };
  }, [router, rawPlan, kiwifyBaseUrl]);

  if (!isPlanValid) {
    return (
      <main className="min-h-screen bg-bg text-ink">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
          <AlertTriangle className="h-14 w-14 text-accent" />
          <h1 className="mt-5 text-3xl font-black">Plano inválido</h1>
          <p className="mt-2 text-muted">O plano solicitado não existe ou não está disponível para compra.</p>
          <Link href="/#planos" className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white">
            Ver planos disponíveis
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !loggedUser || !planInfo) {
    return (
      <main className="min-h-screen bg-bg text-ink">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg text-ink">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href={planId === "pro" ? "/para-mim" : "/para-vender"} className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Voltar para planos
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-br from-ink to-ink/95 px-7 py-7 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Confirmação de compra</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">
              Plano {planInfo.name}
            </h1>
            <p className="mt-2 text-white/70">
              {planInfo.priceAnnual ? (
                <>
                  <span className="text-4xl font-black text-white">
                    R$ {planInfo.priceMonthly.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="ml-1 text-sm font-bold">/mês</span>
                  <span className="ml-3 text-xs text-white/60">ou R$ {planInfo.priceAnnual}/ano</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-black text-white">
                    R$ {planInfo.priceMonthly.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="ml-1 text-sm font-bold">/mês</span>
                </>
              )}
            </p>
          </div>

          {/* Corpo */}
          <div className="space-y-6 px-7 py-8">
            {/* BLOCO 1 — Conta logada e email */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-black text-ink">Você está logado na sua conta Toqy</h2>
                  <p className="mt-1 text-sm text-muted">
                    O plano comprado agora será ativado automaticamente nesta conta após a aprovação do pagamento.
                  </p>
                  <div className="mt-4 rounded-2xl border-2 border-ink bg-white px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-wide text-muted">E-mail da sua conta</p>
                    <p className="mt-1 break-all text-2xl font-black text-ink">{loggedUser.email}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* BLOCO 2 — AVISO MUITO CLARO sobre o email */}
            <section className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h2 className="text-lg font-black text-accent">
                    Atenção: compre com EXATAMENTE este e-mail
                  </h2>
                  <div className="mt-2 space-y-2 text-sm font-bold text-ink/90">
                    <p>
                      <CheckCircle2 className="-mt-0.5 mr-2 inline h-4 w-4 text-accent" />
                      Na página de pagamento da Kiwify, confirme que o e-mail preenchido é{" "}
                      <span className="bg-ink/5 px-1.5 py-0.5 font-black">{loggedUser.email}</span>
                    </p>
                    <p>
                      <CheckCircle2 className="-mt-0.5 mr-2 inline h-4 w-4 text-accent" />
                      Se você comprar com OUTRO e-mail, seu plano NÃO será ativado automaticamente.
                    </p>
                    <p>
                      <CheckCircle2 className="-mt-0.5 mr-2 inline h-4 w-4 text-accent" />
                      Nós já enviamos este e-mail pré-preenchido pra Kiwify, é só confirmar.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* BLOCO 3 — Cupom de desconto / indicação */}
            {coupon.couponCode ? (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                  <div>
                    <h2 className="text-lg font-black text-emerald-800">
                      🎉 Desconto aplicado automaticamente
                    </h2>
                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      Cupom <span className="font-black">{coupon.couponCode}</span>{" "}
                      (
                      {coupon.couponCode === "REVENDA15"
                        ? "15% de desconto — indicado por um revendedor"
                        : coupon.couponCode === "REVENDA10"
                        ? "10% de desconto — indicado por um revendedor"
                        : "desconto aplicado"}
                      )
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {/* BLOCO 4 — Checkbox de confirmação */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-bg p-5 transition hover:border-accent/40">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-5 w-5 accent-accent"
              />
              <span className="text-sm font-bold text-ink/90">
                Eu entendo que a compra deve ser feita com o e-mail{" "}
                <span className="bg-ink/5 px-1 font-black">{loggedUser.email}</span>{" "}
                e que, se eu usar outro e-mail, terei que contatar o suporte manualmente para ativar o plano.
              </span>
            </label>

            {/* BLOCO 5 — CTA final */}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/app/configuracoes" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border px-5 py-3.5 text-sm font-black text-ink transition hover:border-accent">
                Ainda não é meu e-mail / quero trocar de conta
              </Link>
              {checkoutUrl ? (
                <a
                  href={confirmed ? checkoutUrl : undefined}
                  onClick={(e) => {
                    if (!confirmed) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  target={confirmed ? "_blank" : undefined}
                  rel={confirmed ? "noopener noreferrer nofollow" : undefined}
                  className={`btn-glow inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 ${
                    confirmed ? "" : "pointer-events-none opacity-50"
                  }`}
                >
                  Ir para pagamento seguro <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="rounded-2xl bg-accent/10 px-5 py-3.5 text-sm font-black text-accent">
                  Carregando link de pagamento...
                </div>
              )}
            </div>
            {!confirmed && (
              <p className="text-center text-xs font-bold text-muted">
                Marque a confirmação acima para liberar o botão de pagamento.
              </p>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <footer className="mt-10 flex items-center justify-center gap-2 text-xs text-muted">
          <span>Pagamento 100% seguro processado pela Kiwify · SSL / Criptografia</span>
        </footer>
      </div>
    </main>
  );
}
