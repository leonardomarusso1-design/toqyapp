import Link from "next/link";
import type { Metadata } from "next";
import { LandingHeader } from "@/components/LandingHeader";
import { ArrowLeft, ArrowRight, Check, QrCode, Receipt, Sparkles, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Bio site com Pix — TOQY",
  description: "Receba pagamentos direto no seu link da bio. QR Code Pix de verdade, valores rápidos e comprovante no WhatsApp — sem sair da página.",
};

const faqItems: [string, string][] = [
  ["O bio site com Pix é de verdade, ou só um link solto?", "É Pix de verdade: o Toqy gera o BR Code oficial (padrão do Banco Central) a partir da sua chave. O cliente aponta o app do banco e paga — não é texto colado, é um QR Code funcional."],
  ["O dinheiro passa pela conta do Toqy?", "Não. O Pix cai direto na sua conta, na hora — o Toqy só gera o código, nunca fica no meio do pagamento."],
  ["Dá pra deixar valores prontos, tipo R$ 20, R$ 50?", "Dá. Você cadastra valores rápidos (botões) e também pode deixar o campo aberto pro cliente digitar o valor exato."],
  ["Funciona em qualquer plano?", "O Pix é recurso do plano Pro (R$ 9,90/mês) em diante — o Gratuito cobre o essencial pra testar a plataforma."],
  ["Preciso de conta em banco específico?", "Não. Qualquer chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória) de qualquer banco funciona."],
];

export default function BioSiteComPixPage() {
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
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">Link na bio com Pix</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Seu link da bio pode <span className="gradient-text">receber pagamento</span>, não só links.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Chave Pix cadastrada, QR Code gerado na hora, cliente paga sem sair da sua página — nada de mandar chave por direct.
        </p>
        <Link href="/onboarding" className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">
          Criar meu bio site com Pix <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-xs font-semibold text-muted">Grátis pra testar. Pix a partir de R$9,90/mês.</p>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">Como funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Wallet, title: "Cadastre sua chave", text: "CPF, CNPJ, e-mail, telefone ou chave aleatória — de qualquer banco." },
              { icon: QrCode, title: "O QR Code é gerado na hora", text: "BR Code oficial (padrão Banco Central), o mesmo que qualquer app de banco reconhece." },
              { icon: Receipt, title: "Cliente paga e você recebe direto", text: "O dinheiro cai na sua conta — o Toqy nunca fica no meio do pagamento." },
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
            "Valores rápidos configuráveis (ex: R$20, R$50) além do valor livre",
            "Comprovante recebido direto no seu WhatsApp",
            "Modal de Pix próprio, sem redirecionar pra outro app ou site",
            "Mesmo link já reúne WhatsApp, catálogo, Wi-Fi e localização",
          ].map((item) => (
            <p key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-ink/80">
              <Check className="h-4 w-4 shrink-0 text-accent" /> {item}
            </p>
          ))}
        </div>
      </section>

      {/* FAQPage estruturado (schema.org) — mesmo padrão de /faq. */}
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
