"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";

// Placeholder da Fase 1 — o fluxo de ativação de placa (cola código →
// escolhe/cadastra negócio → confirma link Google) entra na Fase 4.
export default function AtivarPlacaPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-black text-ink md:text-3xl">Ativar placa — em breve</h1>
        <p className="mt-3 text-muted">
          O fluxo de ativação de placas de revenda está sendo montado. Enquanto isso, entre no grupo de lançamento no WhatsApp.
        </p>
        <Link href="/placas" className="mt-6 inline-flex rounded-full border border-border bg-white px-6 py-3 text-sm font-black text-ink transition hover:border-accent">
          Ver placas
        </Link>
      </div>
    </DashboardShell>
  );
}
