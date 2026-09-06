import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Perguntas frequentes — TOQY",
  description: "Dúvidas comuns sobre o TOQY: como funciona, planos, pagamento, plaquinha física e edição do bio site.",
};

const faqItems = [
  ["O que é um bio site TOQY?", "É uma página digital profissional que concentra todos os links, contatos, catálogo, Pix e Wi-Fi do seu negócio em um único lugar — o link que você coloca na bio do Instagram."],
  ["Preciso saber programar?", "Não. O TOQY tem um editor visual completo — você personaliza logo, cores, botões e catálogo sem tocar em código."],
  ["O que é a plaquinha física?", "É uma placa acrílica com QR Code e/ou chip NFC que o cliente toca ou escaneia com o celular para abrir o bio site — uma alternativa ao link, opcional."],
  ["O cliente pode editar o bio site dele?", "Sim. Cada bio site tem uma chave de acesso exclusiva para o cliente editar a própria página quando quiser."],
  ["Posso usar o TOQY para vender para outros negócios?", "Sim. Os planos Essencial, Freelancer e Agência são feitos pra isso — veja em /para-vender."],
  ["Como funciona o plano Gratuito?", "Você pode criar 1 bio site gratuitamente para conhecer a plataforma. Para recursos completos (Pix, Wi-Fi, catálogo), faça upgrade para o Pro ou um plano de revenda."],
  ["Os pagamentos são seguros?", "Sim. Os pagamentos são processados pela Kiwify, com certificação de segurança."],
  ["Posso cancelar quando quiser?", "Sim. Você pode cancelar a assinatura a qualquer momento pelo painel da Kiwify."],
] as const;

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-14 w-auto object-contain md:h-16" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mt-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Dúvidas</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">Perguntas frequentes</h1>
        </div>

        <div className="mt-10 space-y-4">
          {faqItems.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-black text-ink">
                {q}
                <span className="ml-4 shrink-0 text-muted transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center">
          <p className="font-bold text-ink">Não encontrou o que procurava?</p>
          <a href="https://wa.me/5519997051919" target="_blank" rel="noreferrer noopener" className="btn-glow mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white">
            <MessageCircle className="h-4 w-4" /> Falar com o suporte
          </a>
        </div>
      </section>
    </main>
  );
}
