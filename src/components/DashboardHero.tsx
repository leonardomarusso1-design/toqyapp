"use client";

import Link from "next/link";
import { Plus, Star, UserRound } from "lucide-react";

// Cabeçalho do painel (2026-09-07) — simplificado de novo, bug real
// reportado ao vivo pelo Leonardo: "Conta, plano atual e visitas na
// página inicial, tá poluído... o Cadastros/Agendamento não deveria
// misturar vários bio sites que criei pra venda, isso é individual, no
// painel de cada biosite". O card de estatísticas agregadas (Visitas/
// Cliques/Contatos somando TODOS os bio sites da conta) tinha
// exatamente esse problema — misturava o tráfego de clientes
// completamente diferentes num número só, sem servir de análise real
// pra ninguém. Removido daqui: cada bio site já tem sua própria página
// de Estatísticas (Análise → Estatísticas, dentro do editor). "Conta" e
// "Plano atual" também saíram da home — já existem, melhor feitos, em
// /app/configuracoes (Perfil + Plano atual). O que sobra aqui é só a
// saudação + o atalho de criar bio site, sem duplicar nada.
function greeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardHero({ name, planLabel, avatarUrl }: { name: string; planLabel: string; avatarUrl: string | null }) {
  return (
    <section className="mb-6">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-6 w-6 text-muted" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-muted">{greeting(new Date().getHours())},</p>
          <h1 className="truncate text-2xl font-black leading-tight text-ink md:text-3xl">{name.split(" ")[0]}</h1>
        </div>
        <Link href="/app/configuracoes" className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-accent/10 px-3 py-2 text-sm font-black text-accent transition hover:bg-accent/20">
          <Star className="h-4 w-4 fill-current" />
          {planLabel}
        </Link>
      </header>

      <Link href="/app/novo" className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-accent px-6 py-5 text-lg font-black text-white shadow-sm transition hover:bg-accent-dim">
        <Plus className="h-5 w-5" /> Novo bio site
      </Link>
    </section>
  );
}
