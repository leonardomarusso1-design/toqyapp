import Link from "next/link";
import type { Metadata } from "next";
import { LandingHeader } from "@/components/LandingHeader";
import { ArrowLeft, ArrowRight, Check, MessageCircle, Sparkles, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Bio site com WhatsApp — TOQY",
  description: "Botão de WhatsApp com mensagem pronta no seu link da bio. O cliente clica e já chega perguntando certo — sem digitar nada.",
};

const faqItems: [string, string][] = [
  ["O que é uma mensagem pré-preenchida no WhatsApp?", "É um texto que já aparece escrito na conversa quando o cliente clica no botão — ele só precisa apertar enviar. Você escolhe o texto, por exemplo \"Olá! Vim pelo seu link e quero agendar um horário\"."],
  ["Isso funciona no celular e no computador?", "Funciona nos dois. No celular abre o app do WhatsApp direto; no computador abre o WhatsApp Web com a mesma mensagem pronta."],
  ["Preciso ter WhatsApp Business?", "Não é obrigatório — funciona com WhatsApp comum ou Business, o link é o mesmo (wa.me)."],
  ["Dá pra ter mais de um número, tipo um pra vendas e outro pra suporte?", "O botão principal de WhatsApp usa um número — pra outros contatos, você pode adicionar botões extras personalizados apontando pra outros números."],
  ["Isso está disponível no plano Gratuito?", "Sim, o botão de WhatsApp com mensagem pronta está disponível desde o plano Gratuito."],
];

export default function BioSiteComWhatsAppPage() {
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
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">Link na bio com WhatsApp</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Chega de responder <span className="gradient-text">&quot;vc faz o que mesmo?&quot;</span> 50 vezes por dia.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          O botão de WhatsApp do seu bio site já chega com a mensagem pronta — o cliente só aperta enviar.
        </p>
        <Link href="/onboarding" className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">
          Criar meu bio site com WhatsApp <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-xs font-semibold text-muted">Grátis pra testar. Sem cartão de crédito.</p>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">Como funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: MessageCircle, title: "Escreva a mensagem uma vez", text: "Ex: \"Olá! Vim pelo seu link e quero agendar um horário.\" — você escreve, o cliente só confirma." },
              { icon: Zap, title: "Um toque, conversa já aberta", text: "Sem copiar número, sem digitar do zero — o botão leva direto pro WhatsApp com o texto pronto." },
              { icon: Check, title: "Menos atrito, mais resposta", text: "Cada campo que o cliente não precisa preencher é um passo a menos até ele realmente falar com você." },
            ].map((s) => (
              <div key={s.title} className="rounded-[1.75rem] border border-border bg-bg p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><s.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">O que mais vem junto</h2>
        <div className="mt-8 grid gap-3">
          {[
            "Botão de WhatsApp desde o plano Gratuito, sem custo extra",
            "Mesma página já reúne Instagram, catálogo, mapa e horário de funcionamento",
            "Editor visual — você escreve a mensagem sem mexer em código",
            "Funciona igual no celular do cliente e no computador",
          ].map((item) => (
            <p key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-ink/80">
              <Check className="h-4 w-4 shrink-0 text-accent" /> {item}
            </p>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map(([q, a]) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />
      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">Perguntas frequentes</h2>
          <div className="mt-8 space-y-4">
            {faqItems.map(([q, a]) => (
              <div key={q} className="rounded-2xl border border-border bg-bg p-5">
                <p className="font-bold text-ink">{q}</p>
                <p className="mt-1.5 text-sm text-muted">{a}</p>
              </div>
            ))}
          </div>
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
