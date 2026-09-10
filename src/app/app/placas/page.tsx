"use client";

import Link from "next/link";
import { Nfc, Package, ShoppingBag } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

// Painel do módulo Placas & Avaliações (Fase 1.3 — shell). As telas de
// verdade (visão geral com números, minhas placas, meus lotes, empresas
// atendidas, ativação) entram nas Fases 3 e 4. Por enquanto é a porta de
// entrada: explica o produto e manda pra landing/compra.
export default function PlacasPanelPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Placas & avaliações</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">Placas com QR Code e NFC pra avaliação no Google</h1>
        <p className="mt-3 text-muted">
          Produto separado dos bio sites. Você compra a placa pronta pro seu negócio, ou compra em lote pra revender pros seus clientes.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/placas/comprar" className="card-glow group rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition hover:border-accent">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><ShoppingBag className="h-5 w-5" /></span>
            <p className="mt-3 text-lg font-black text-ink">Comprar pro meu negócio</p>
            <p className="mt-1 text-sm text-muted">Placa já configurada com o link de avaliação do seu Google Meu Negócio.</p>
          </Link>
          <Link href="/placas/revenda" className="card-glow group rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition hover:border-accent">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Package className="h-5 w-5" /></span>
            <p className="mt-3 text-lg font-black text-ink">Comprar em lote e revender</p>
            <p className="mt-1 text-sm text-muted">Placas com QR e chip em branco. Você ativa cada uma quando vender, pelo próprio painel.</p>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-5">
          <p className="inline-flex items-center gap-2 text-sm font-black text-ink"><Nfc className="h-4 w-4 text-accent" /> Seus pedidos e placas aparecem aqui</p>
          <p className="mt-1 text-sm text-muted">Depois da primeira compra, esta área mostra seus lotes, placas ativadas e empresas atendidas.</p>
          <Link href="/placas" className="mt-3 inline-flex text-sm font-black text-accent-dim underline">Ver a página de placas</Link>
        </div>
      </div>
    </DashboardShell>
  );
}
