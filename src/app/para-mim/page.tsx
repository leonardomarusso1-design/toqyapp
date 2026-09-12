import Link from "next/link";
import type { Metadata } from "next";
import { LandingHeader } from "@/components/LandingHeader";
import { personalPlans } from "@/lib/landingPlans";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Image as ImageIcon,
  Music,
  QrCode,
  Sparkles,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Para o meu negócio — TOQY",
  description: "Um bio site profissional pro seu negócio: WhatsApp, Pix, Wi-Fi, catálogo e QR Code. Grátis pra testar, R$9,90/mês pro completo.",
};

const highlights = [
  { icon: QrCode, title: "QR Code e Pix", text: "Receba na hora e leve seus clientes pro WhatsApp com um toque." },
  { icon: ImageIcon, title: "Figurinhas e visual próprio", text: "Deixe seu bio site com a sua cara — cores, fundo, botões e figurinhas." },
  { icon: Music, title: "Música no bio site", text: "Toque uma música de fundo ou destaque uma faixa do Spotify, direto na página." },
  { icon: Globe, title: "Domínio próprio", text: "Se quiser, aponte um domínio que já é seu — add-on avulso, sem mexer na mensalidade." },
] as const;

export default function ParaMimPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/toqy-logo.svg" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
          </Link>
          <LandingHeader />
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-16 text-center lg:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">Para o meu negócio</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Seu negócio merece uma página que <span className="gradient-text">vende por você</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Um lugar só com WhatsApp, Pix, Wi-Fi e catálogo — pronto em minutos, sem precisar contratar ninguém.
        </p>
        <Link href="/login" className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">
          Criar meu bio site grátis <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-xs font-semibold text-muted">Sem cartão de crédito. Cancele quando quiser.</p>
      </section>

      {/* COMO FUNCIONA — 3 passos, mesma estrutura da home mas com foco pessoal */}
      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">Como funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", title: "Escolha seu segmento", text: "Barbearia, salão, loja, clínica... comece de um modelo pronto pro seu tipo de negócio." },
              { n: "2", title: "Personalize em minutos", text: "Editor visual: cores, fotos, botões, catálogo — sem mexer em código." },
              { n: "3", title: "Compartilhe e receba clientes", text: "Link, QR Code ou plaquinha física — do jeito que fizer sentido pra você." },
            ].map((s) => (
              <div key={s.n} className="rounded-[1.75rem] border border-border bg-bg p-7">
                <span className="gradient-text text-5xl font-extrabold">{s.n}</span>
                <h3 className="mt-3 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUES DO PRO */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">O que o Pro libera</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {highlights.map((h) => (
            <div key={h.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><h.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-bold text-ink">{h.title}</h3>
              <p className="mt-1 text-sm text-muted">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS — Gratuito vs Pro */}
      <section id="planos" className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Planos</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Comece grátis, evolua quando fizer sentido</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {personalPlans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-3xl border bg-bg p-7 shadow-sm ${plan.highlight ? "border-accent shadow-xl shadow-accent/10" : "border-border"}`}>
                {plan.highlight ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-white">Recomendado</span> : null}
                <h3 className="text-2xl font-bold text-ink">{plan.name}</h3>
                <p className="mt-2 min-h-[3rem] text-sm text-muted">{plan.description}</p>
                <p className="mt-4 text-4xl font-extrabold text-ink">{plan.price}<span className="text-base font-bold text-muted">{plan.period}</span></p>
                <span className={`mt-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold ${plan.highlight ? "bg-accent/15 text-accent" : "bg-surface text-muted"}`}>{plan.tag}</span>
                <div className="mt-6 grid flex-1 gap-3">
                  {plan.items.map((item) => (
                    <p key={item} className="flex items-center gap-3 text-sm font-semibold text-ink/80">
                      <Check className="h-4 w-4 shrink-0 text-accent" /> {item}
                    </p>
                  ))}
                </div>
                {plan.name === "Pro" ? (
                  <Link href="/checkout?plan=pro" className="btn-glow mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">{plan.cta}</Link>
                ) : (
                  <Link href="/login" className="mt-7 inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:border-accent">{plan.cta}</Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BRIDGE — errou o caminho? */}
      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <div className="rounded-3xl border border-border bg-card p-8">
          <Wallet className="mx-auto h-7 w-7 text-accent" />
          <p className="mt-3 font-bold text-ink">Na verdade você quer criar bio sites pra vender pra outros negócios?</p>
          <Link href="/para-vender" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent">Ver planos de revenda <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-10 text-center text-xs text-muted">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <p>© {new Date().getFullYear()} Marusso Produções · <Link href="/termos" className="hover:text-accent">Termos</Link> · <Link href="/privacidade" className="hover:text-accent">Privacidade</Link></p>
        </div>
      </footer>
    </main>
  );
}
