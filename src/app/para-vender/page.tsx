import Link from "next/link";
import type { Metadata } from "next";
import { EbookLeadForm } from "@/components/EbookLeadForm";
import { LandingHeader } from "@/components/LandingHeader";
import { resellerPlans } from "@/lib/landingPlans";
import { RESELLER_TIERS } from "@/lib/resellerTiers";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gift,
  Handshake,
  Sparkles,
  Star,
  Store,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Vender bio sites — TOQY",
  description: "Crie bio sites pra clientes, cobre mensalidade e ganhe comissão indicando. Planos Essencial, Freelancer e Agência, até 100 bio sites.",
};

export default function ParaVenderPage() {
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
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">Vender bio sites</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Monte uma <span className="gradient-text">renda recorrente</span> criando bio sites pra clientes.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Você cria, entrega e cobra mensalidade. O Toqy cuida do editor, do catálogo e do Pix.
        </p>
        <a href="#planos" className="btn-glow mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white">
          Ver planos de revenda <ArrowRight className="h-4 w-4" />
        </a>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">Tão simples que parece mágica</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", title: "Escolha o segmento", text: "Comece a partir de um modelo pronto para o nicho do cliente e personalize em segundos." },
              { n: "2", title: "O Toqy monta tudo", text: "Editor visual gera logo, cores, botões, catálogo, Pix e Wi-Fi — sem código." },
              { n: "3", title: "Publique e venda", text: "Compartilhe por QR Code, NFC ou link. O cliente edita quando quiser com a chave." },
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

      {/* MARGEM E PAINEL (2026-09-06, auditoria externa, seção 5: "o funil
          de revenda deve ter uma landing própria com exemplo de margem,
          fluxo de entrega e painel de clientes"). O fluxo já estava
          acima ("Como funciona"); faltavam a conta e o que o revendedor
          recebe pra administrar os clientes.

          Os valores da tabela são EXEMPLO de precificação de mercado,
          não promessa de ganho — está escrito assim embaixo dela de
          propósito. Quem define quanto cobra é o revendedor. */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink md:text-3xl">A conta que interessa</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          Negócio local costuma aceitar uma mensalidade entre R$ 39 e R$ 99 pela página e pela manutenção. Um exemplo, cobrando R$ 59 por cliente:
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[420px] overflow-hidden rounded-[1.5rem] border border-border bg-card text-left text-sm">
            <thead className="bg-surface text-xs font-black uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-4">Clientes</th>
                <th className="px-5 py-4">Recorrente por mês</th>
                <th className="px-5 py-4">Em 12 meses</th>
              </tr>
            </thead>
            <tbody className="font-bold text-ink">
              {[5, 10, 20, 50].map((clientes) => (
                <tr key={clientes} className="border-t border-border">
                  <td className="px-5 py-4">{clientes}</td>
                  <td className="px-5 py-4">R$ {(clientes * 59).toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-4">R$ {(clientes * 59 * 12).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-xs font-semibold text-muted">
          Exemplo de precificação, não promessa de ganho. Você define quanto cobra; sobre isso incide só o custo do seu plano Toqy.
        </p>

        <h2 className="mt-16 text-center text-2xl font-extrabold text-ink md:text-3xl">O painel de clientes</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          Tudo que você precisa pra administrar as páginas dos seus clientes num lugar só.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            { t: "Todos os clientes numa lista", d: "Cada bio site com nome, link e status. Você abre, edita e publica sem sair do painel." },
            { t: "Chave de edição por cliente", d: "O cliente edita a própria página em toqy.com.br/me sem entrar na sua conta e sem ver os outros clientes. Se a chave vazar, você gera outra em um clique." },
            { t: "Tirar do ar em um clique", d: "Cliente atrasou a mensalidade? A página sai do ar e volta depois — sem apagar nada." },
            { t: "Sua marca no lugar da nossa", d: "No plano Agência, o rodapé passa a levar o nome, a logo e o link da sua agência." },
          ].map((item) => (
            <div key={item.t} className="rounded-[1.75rem] border border-border bg-card p-6">
              <h3 className="text-lg font-black text-ink">{item.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EBOOK LEAD MAGNET (migrado da home, 2026-09-05) */}
      <section className="bg-gradient-to-br from-ink to-ink/95 py-16 text-white">
        <div className="mx-auto max-w-4xl px-5">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Ebook grátis</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">7 Formas de Ganhar Dinheiro com Bio Sites</h2>
              <p className="mt-4 text-white/70">Descubra como começar a vender bio sites como serviço, quais nichos são mais lucrativos e como precificar seus serviços corretamente.</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Nichos que pagam mais caro por bio sites",
                  "Como precificar seus serviços (R$97 a R$497)",
                  "Script pronto para oferecer para clientes",
                  "Modelo de contrato editável",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                    <Check className="h-5 w-5 shrink-0 text-accent" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-glow rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
              <h3 className="text-xl font-extrabold">Baixe o ebook grátis</h3>
              <p className="mt-2 text-sm text-white/70">Preencha abaixo e receba no seu email:</p>
              <EbookLeadForm />
              <p className="mt-4 text-center text-xs text-white/50">Não enviamos spam. Você pode cancelar a qualquer momento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Planos</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Escolha o tamanho da sua operação</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">Todos mensais, cancele quando quiser.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {resellerPlans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm transition hover:-translate-y-1 ${plan.highlight ? "border-accent shadow-xl shadow-accent/10 glow-pulse" : "border-border card-glow"}`}>
                {plan.highlight ? <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2 text-xs font-extrabold text-white uppercase tracking-wider">Mais popular</span> : null}
                <h3 className="text-2xl font-bold text-ink">{plan.name}</h3>
                <p className="mt-2 min-h-[4rem] text-sm text-muted">{plan.description}</p>
                <p className="mt-4 text-4xl font-extrabold text-ink">{plan.price}<span className="text-base font-bold text-muted">{plan.period}</span></p>
                <span className={`mt-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-extrabold ${plan.highlight ? "bg-accent/15 text-accent" : "bg-surface text-muted"}`}>{plan.tag}</span>
                <div className="mt-6 grid flex-1 gap-3">
                  {plan.items.map((item) => {
                    const isExclusive = item.startsWith("★ ");
                    const label = isExclusive ? item.slice(2) : item;
                    return isExclusive ? (
                      <p key={item} className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-accent/15 to-transparent px-2 py-1 text-sm font-black text-accent">
                        <Star className="h-4 w-4 shrink-0 fill-accent text-accent" /> {label}
                      </p>
                    ) : (
                      <p key={item} className="flex items-center gap-3 text-sm font-semibold text-ink/80">
                        <Check className="h-4 w-4 shrink-0 text-accent" /> {label}
                      </p>
                    );
                  })}
                </div>
                <Link href={`/checkout?plan=${plan.name === "Essencial" ? "community" : plan.name === "Freelancer" ? "freelancer" : "agency"}`} className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${plan.highlight ? "btn-glow text-white" : "border border-border text-ink hover:border-accent"}`}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-3xl">
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center">
              <p className="text-sm font-bold text-ink">
                💡 <strong>Essencial ou Freelancer?</strong> Os dois são mensais e você pode cancelar quando quiser. O Essencial é o ponto de entrada mais barato. O Freelancer custa um pouco mais e traz analytics avançado e suporte prioritário — vale a pena se você atende clientes com mais frequência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GANHE DINHEIRO (migrado da home, 2026-09-05) — números reais de RESELLER_TIERS, nada inventado */}
      <section className="border-t border-border bg-gradient-to-br from-ink to-ink/95 py-16 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Programa de indicação</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Ganhe dinheiro indicando o Toqy</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-white/70">Quem já assina Freelancer ou Agência ganha automaticamente um link de indicação — sem precisar &quot;virar revendedor&quot;, é um benefício de quem já paga.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {(["freelancer", "agency"] as const).map((tier) => {
              const config = RESELLER_TIERS[tier];
              const label = tier === "freelancer" ? "Freelancer" : "Agência";
              return (
                <div key={tier} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Plano {label}</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <div>
                      <Wallet className="h-6 w-6 text-accent" />
                      <p className="mt-3 text-3xl font-black">{config.commissionPct}%</p>
                      <p className="mt-1 text-sm text-white/70">de comissão por venda</p>
                    </div>
                    <div>
                      <Handshake className="h-6 w-6 text-accent" />
                      <p className="mt-3 text-3xl font-black">{config.buyerDiscountPct}%</p>
                      <p className="mt-1 text-sm text-white/70">de desconto pra quem você indicar</p>
                    </div>
                    <div>
                      <Gift className="h-6 w-6 text-accent" />
                      <p className="mt-3 text-3xl font-black">+{config.bonusSites}</p>
                      <p className="mt-1 text-sm text-white/70">bio site{config.bonusSites > 1 ? "s" : ""} de bônus por venda</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BRIDGE — errou o caminho? */}
      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <div className="rounded-3xl border border-border bg-card p-8">
          <Store className="mx-auto h-7 w-7 text-accent" />
          <p className="mt-3 font-bold text-ink">Na verdade você só quer um bio site pro seu próprio negócio?</p>
          <Link href="/para-mim" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent">Ver plano Gratuito e Pro <ArrowRight className="h-4 w-4" /></Link>
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
