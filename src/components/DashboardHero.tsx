"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, MousePointerClick, Plus, Star, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Cabeçalho do painel (2026-09-07) — REESCRITO depois de bug real
// reportado ao vivo pelo Leonardo: a versão anterior escolhia UM bio
// site (o mais recente) e mostrava ele como se fosse "o" bio site do
// usuário — prévia, estatísticas dele, botão "Editar meu bio site". Mas
// o Leonardo é revendedor: ele já tinha VÁRIOS bio sites de VÁRIOS
// clientes diferentes (Fox Automóveis, Só Móveis, Yakisabor...), e o
// painel mostrava um deles aleatoriamente como se fosse pessoal —
// "esse não é meu biosite". Card de site único removido por completo;
// os números agora são a SOMA de todos os bio sites da conta (RLS de
// toqy_analytics_events já restringe a leitura aos sites do dono
// logado, então a query nem precisa filtrar por site — automaticamente
// não vaza dado de outra conta). A lista de sites individuais continua
// existindo, mais abaixo na página ("Meus bio sites"), que é o lugar
// certo pra ver/editar cada um.
const CONTACT_EVENTS = ["whatsapp_click", "phone_click"];

type Stats = { views: number; clicks: number; contacts: number };

function greeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardHero({ name, planLabel, avatarUrl }: { name: string; planLabel: string; avatarUrl: string | null }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      // Sem .eq("bio_site_id", ...) de propósito: a policy
      // toqy_analytics_events_owner_read já restringe a leitura aos
      // bio sites do dono logado — somar "todos os eventos que eu
      // consigo ler" já é, por definição, "todos os meus bio sites".
      const base = () => supabase.from("toqy_analytics_events").select("id", { count: "exact", head: true }).gte("created_at", desde);
      const [views, clicks, contacts] = await Promise.all([
        base().eq("event_type", "page_view"),
        base().neq("event_type", "page_view"),
        base().in("event_type", CONTACT_EVENTS),
      ]);
      if (!active) return;
      setStats({ views: views.count ?? 0, clicks: clicks.count ?? 0, contacts: contacts.count ?? 0 });
    })();
    return () => { active = false; };
  }, []);

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
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-accent/10 px-3 py-2 text-sm font-black text-accent">
          <Star className="h-4 w-4 fill-current" />
          {planLabel}
        </span>
      </header>

      <div className="mt-5 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-border">
          <Stat icon={<Eye className="h-5 w-5" />} label="Visitas" value={stats?.views} />
          <Stat icon={<MousePointerClick className="h-5 w-5" />} label="Cliques" value={stats?.clicks} />
          <Stat icon={<UserRound className="h-5 w-5" />} label="Contatos" value={stats?.contacts} />
        </div>
        <p className="border-t border-border py-3 text-center text-sm font-semibold text-muted">Todos os seus bio sites, últimos 7 dias</p>
      </div>

      <Link href="/app/novo" className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-accent px-6 py-5 text-lg font-black text-white shadow-sm transition hover:bg-accent-dim">
        <Plus className="h-5 w-5" /> Novo bio site
      </Link>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-1 py-4 sm:flex-row sm:gap-2 sm:px-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent sm:h-10 sm:w-10">{icon}</span>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-[11px] font-semibold text-muted sm:text-xs">{label}</p>
        <p className="text-lg font-black leading-tight text-ink sm:text-xl">{value === undefined ? "—" : value.toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}
