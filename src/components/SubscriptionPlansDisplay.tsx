/**
 * Subscription Plans Component
 * FASE 6 — Visual Plans Display
 * 
 * Displays subscription plan cards with features and pricing.
 * Payment integration will be handled separately.
 */

"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS, formatPrice, getAnnualSavings } from "@/lib/subscriptions";

export function SubscriptionPlansDisplay() {
  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Planos</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Escolha o plano ideal para o seu negócio
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Comece grátis e upgrade quando precisar. Sem compromisso, cancele a qualquer momento.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`relative flex flex-col rounded-[2rem] border bg-white p-7 shadow-sm transition hover:-translate-y-1 ${
              plan.highlight ? "border-[#31c4a8] shadow-xl shadow-emerald-100" : "border-slate-100"
            }`}
          >
            {plan.highlight ? (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#31c4a8] px-5 py-2 text-xs font-black text-white">
                Mais popular
              </span>
            ) : null}

            {/* Plan Name */}
            <h3 className="text-2xl font-black">{plan.name}</h3>

            {/* Plan Description */}
            <p className="mt-2 min-h-16 text-sm text-slate-500">{plan.description}</p>

            {/* Pricing */}
            <div className="mt-4">
              <div className="text-4xl font-black">
                {formatPrice(plan.priceMonthly)}
                <span className="text-base font-bold text-slate-500">/mês</span>
              </div>
              {plan.priceAnnual && (
                <p className="mt-1 text-xs text-emerald-600 font-bold">
                  ou {formatPrice(plan.priceAnnual)}/ano (economize{" "}
                  {formatPrice(getAnnualSavings(plan.id) || 0)})
                </p>
              )}
            </div>

            {/* Features List */}
            <div className="mt-6 grid gap-3 flex-1">
              {plan.features.map((feature) => (
                <p key={feature} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <Check className="h-4 w-4 shrink-0 text-[#31c4a8]" />
                  {feature}
                </p>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href={
                plan.id === "community"
                  ? "https://pay.kiwify.com.br/12uYE0c"
                  : plan.id === "freelancer"
                  ? "https://pay.kiwify.com.br/Oc2YP5A"
                  : plan.id === "agency"
                  ? "https://pay.kiwify.com.br/X71Qhtu"
                  : "/login"
              }
              target={plan.id === "free" ? undefined : "_blank"}
              rel={plan.id === "free" ? undefined : "noreferrer noopener"}
              className={`mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                plan.highlight
                  ? "bg-[#31c4a8] text-white hover:bg-[#25b69a]"
                  : "border border-slate-200 text-slate-900 hover:border-[#31c4a8]"
              }`}
            >
              {plan.priceMonthly === 0 ? "Começar grátis" : "Assinar agora"}
            </a>

            {/* Additional Info */}
            {plan.id !== "free" && (
              <p className="mt-4 text-center text-xs text-slate-500">
                Teste grátis por 7 dias. Sem cartão necessário.
              </p>
            )}
          </article>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h3 className="mb-6 text-2xl font-black">Comparação completa de recursos</h3>
        <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-black text-slate-900">Recurso</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-6 py-4 text-center font-black text-slate-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { label: "Bio sites", values: ["1", "20", "20", "100"] },
                { label: "QR Code", values: ["Básico", "Personalizado", "Personalizado", "Personalizado"] },
                { label: "Pix & Wi-Fi", values: ["Não", "Sim", "Sim", "Sim"] },
                { label: "Catálogo", values: ["Não", "Básico", "Completo", "Completo"] },
                { label: "Analytics", values: ["Não", "Básico", "Avançado", "Avançado + API"] },
                { label: "White Label", values: ["Não", "Não", "Não", "Sim"] },
                { label: "Domínio próprio", values: ["Não", "Não", "Não", "Sim"] },
                { label: "Suporte", values: ["Community", "Email", "Prioritário", "24/7"] },
              ].map((row) => (
                <tr key={row.label}>
                  <td className="px-6 py-4 font-bold text-slate-900">{row.label}</td>
                  {row.values.map((value, idx) => (
                    <td key={idx} className="px-6 py-4 text-center text-sm text-slate-600">
                      {value === "Sim" ? (
                        <Check className="mx-auto h-5 w-5 text-[#31c4a8]" />
                      ) : value === "Não" ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
