import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { ArrowRight, Check, Clock, MapPin, MessageCircle, Nfc, QrCode, Star } from "lucide-react";
import { PlateFunnelPing } from "./PlateFunnelPing";
import { getPlateProductsServer } from "@/lib/plate/catalogServer";
import { PLATE_PREORDER, plateLaunchWhatsappGroup } from "@/lib/plate/config";

// ISR: revalida o catálogo/config a cada 5 min sem precisar de deploy
// (Leonardo pode ligar/desligar "em breve" de um produto no banco).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Placas de avaliação com QR Code e NFC | Toqy",
  description:
    "Placa pronta pro seu negócio receber mais avaliações no Google. QR Code e NFC apontando pra sua avaliação, com link dinâmico — troca o destino sem reimprimir. Compre pro seu negócio ou em lote pra revender.",
  alternates: { canonical: "/placas" },
};

// Landing própria do módulo Placas & Avaliações (Fase 1.4). Identidade
// própria, mas usando os tokens de tema do Toqy (não quebra a marca).
// Os CTAs vão pro wizard (/placas/comprar e /placas/revenda), que nesta
// fase ainda são placeholders "em breve".
export default async function PlacasLandingPage() {
  const products = await getPlateProductsServer();
  const launchGroup = plateLaunchWhatsappGroup();

  return (
    <main className="min-h-screen bg-bg text-ink">
      <PlateFunnelPing event="landing_view" />
      <LandingHeader />

      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center md:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-accent-dim">
            <Nfc className="h-3.5 w-3.5" /> Placas & avaliações
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Aproximou. Clicou. Avaliou.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            A placa que fica no balcão do seu negócio e leva o cliente direto pra deixar a avaliação no
            Google. Com QR Code e NFC. Você troca o link quando quiser, sem reimprimir nada.
          </p>

          {PLATE_PREORDER.enabled ? (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-accent/30 bg-accent/10 p-4 text-left">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent-dim">
                <Clock className="h-3.5 w-3.5" /> {PLATE_PREORDER.badge}
              </p>
              <p className="mt-1.5 text-base font-black text-ink">{PLATE_PREORDER.headline}</p>
              <p className="mt-1 text-sm text-muted">{PLATE_PREORDER.detail}</p>
            </div>
          ) : null}

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/placas/comprar"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-base font-black text-white shadow-sm transition hover:bg-accent-dim sm:w-auto"
            >
              Quero uma placa pro meu negócio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/placas/revenda"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-7 py-4 text-base font-black text-ink transition hover:border-accent sm:w-auto"
            >
              Comprar em lote e revender
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={<QrCode className="h-5 w-5" />} title="QR Code + NFC" desc="O cliente aproxima o celular ou escaneia. Cai direto na sua página de avaliação do Google." />
          <Feature icon={<MapPin className="h-5 w-5" />} title="Link dinâmico" desc="O QR aponta pra um link do Toqy. Mudou o Google do negócio? Troca aqui, a placa continua a mesma." />
          <Feature icon={<Star className="h-5 w-5" />} title="Feito pra usar todo dia" desc="Chega pronta pra ficar no balcão, na mesa ou na recepção. Sem mensalidade — pagamento único." />
        </div>
      </section>

      {products.length ? (
        <section className="mx-auto max-w-5xl px-5 pb-8">
          <h2 className="text-2xl font-black text-ink md:text-3xl">Os formatos</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className={`rounded-[1.75rem] border p-6 shadow-sm ${p.comingSoon ? "border-border bg-surface opacity-70" : "border-border bg-white"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-lg font-black text-ink">{p.name}</p>
                  {p.comingSoon ? <span className="shrink-0 rounded-full bg-ink/10 px-2.5 py-0.5 text-[11px] font-black text-ink">Em breve</span> : null}
                </div>
                {p.description ? <p className="mt-1 text-sm text-muted">{p.description}</p> : null}
                <p className="mt-3 text-xs font-black uppercase tracking-wider text-accent-dim">QR Code + NFC</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {launchGroup ? (
        <section className="mx-auto max-w-3xl px-5 py-10">
          <a
            href={launchGroup}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 transition hover:bg-emerald-500/20"
          >
            <span>
              <span className="block text-sm font-black text-ink">Entre no grupo de lançamento no WhatsApp</span>
              <span className="block text-xs text-muted">Novidades, preço de lançamento e prazo de entrega em primeira mão.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white">
              <MessageCircle className="h-4 w-4" /> Entrar
            </span>
          </a>
        </section>
      ) : null}

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-2xl font-black md:text-3xl">Dois jeitos de comprar</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/5 p-6">
              <p className="text-lg font-black">Pro meu negócio</p>
              <p className="mt-1 text-sm text-white/70">A placa já sai configurada com a avaliação do seu Google. É só posicionar e usar.</p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {["Busca o seu negócio no Google", "Escolhe o formato da placa", "Recebe pronta, QR e NFC já configurados"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{t}</li>
                ))}
              </ul>
              <Link href="/placas/comprar" className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-black text-white transition hover:bg-accent-dim">
                Comprar pro meu negócio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-[1.75rem] border border-white/15 bg-white/5 p-6">
              <p className="text-lg font-black">Pra revender</p>
              <p className="mt-1 text-sm text-white/70">Compra um lote com placas em branco. Ativa cada uma quando vender, pelo painel do Toqy.</p>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {["Placas com QR e chip em branco", "Cada unidade tem um código de ativação único", "Você configura o destino de cada placa no painel"].map((t) => (
                  <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{t}</li>
                ))}
              </ul>
              <Link href="/placas/revenda" className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10">
                Comprar em lote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-10 text-center text-sm text-muted">
        <p>Toqy — Placas & avaliações. <Link href="/" className="font-black text-accent-dim underline">Voltar pro Toqy</Link></p>
      </footer>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-white p-6 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">{icon}</span>
      <p className="mt-3 text-lg font-black text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </div>
  );
}
