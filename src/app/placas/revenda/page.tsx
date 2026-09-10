import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/LandingHeader";
import { PlateFunnelPing } from "../PlateFunnelPing";

export const metadata: Metadata = { title: "Comprar placas em lote pra revender | Toqy", robots: { index: false } };

// Placeholder da Fase 1 — o fluxo de compra de lote + geração de códigos
// entra na Fase 4.
export default function RevendaPlacaPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <PlateFunnelPing event="click_reseller" />
      <LandingHeader />
      <section className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="text-xs font-black uppercase tracking-wider text-accent-dim">Pré-venda de lançamento</p>
        <h1 className="mt-2 text-2xl font-black md:text-3xl">Compra em lote pra revender — abrindo em breve</h1>
        <p className="mt-3 text-muted">
          O painel de revenda de placas está sendo montado. Entre no grupo de lançamento no WhatsApp pra reservar seu lote com preço de lançamento.
        </p>
        <Link href="/placas" className="mt-6 inline-flex rounded-full border border-border bg-white px-6 py-3 text-sm font-black text-ink transition hover:border-accent">
          Ver o grupo de lançamento
        </Link>
      </section>
    </main>
  );
}
