"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, MousePointerClick, Pencil, Share2, Star, UserRound, CalendarDays } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";
import { ScaledSitePreview } from "./ScaledSitePreview";
import { toPublicSite } from "@/lib/publicSite";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

// Painel no formato de app (2026-09-06, mockup "toqy-mobile-dashboard-
// conceito.png" da auditoria): saudação + plano, um card com a prévia do
// bio site principal, os números dos últimos 7 dias e um único botão
// grande de ação. Antes o /app abria direto em blocos de conta/plano —
// informação de configuração, não o que a pessoa vem ver.
//
// "Contatos" no lugar de "Leads" (o mockup escrevia "Leads"): o Toqy não
// captura cadastro no bio site, então não existe lead de verdade pra
// contar. O que existe é clique em WhatsApp e telefone — contato direto.
// Preferi o número honesto ao rótulo bonito.
const CONTACT_EVENTS = ["whatsapp_click", "phone_click"];

type Stats = { views: number; clicks: number; contacts: number };

function greeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardHero({ site, name, planLabel, avatarUrl }: { site: ToqySite | null; name: string; planLabel: string; avatarUrl: string | null }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);
  const publicUrl = site ? `https://toqy.com.br/b/${site.slug}` : "";

  useEffect(() => {
    if (!site?.id) return;
    let active = true;
    (async () => {
      const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const base = () => supabase.from("toqy_analytics_events").select("id", { count: "exact", head: true }).eq("bio_site_id", site.id).gte("created_at", desde);
      const [views, clicks, contacts] = await Promise.all([
        base().eq("event_type", "page_view"),
        base().neq("event_type", "page_view"),
        base().in("event_type", CONTACT_EVENTS),
      ]);
      if (!active) return;
      setStats({ views: views.count ?? 0, clicks: clicks.count ?? 0, contacts: contacts.count ?? 0 });
    })();
    return () => { active = false; };
  }, [site?.id]);

  async function share() {
    if (!publicUrl) return;
    // Web Share API é o caminho nativo no celular (abre a folha do
    // sistema, com WhatsApp e Instagram na lista). No desktop não existe
    // na maioria dos navegadores — cai pra copiar o link.
    if (navigator.share) {
      try { await navigator.share({ title: site?.profile.name, url: publicUrl }); return; } catch { /* usuário cancelou */ }
    }
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <button type="button" onClick={share} aria-label="Compartilhar bio site" disabled={!site} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-ink transition hover:border-accent disabled:opacity-40">
          <Share2 className="h-5 w-5" />
        </button>
      </header>
      {copied ? <p className="mt-2 text-right text-xs font-black text-accent">Link copiado.</p> : null}

      {site ? (
        <>
          <div className="mt-5 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3 p-4">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-surface px-3 py-2 text-sm font-black text-ink">
                <span className={`h-2.5 w-2.5 rounded-full ${site.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                {site.status === "active" ? "Meu bio site" : "Bio site offline"}
              </span>
              <Link href={`/b/${site.slug}`} target="_blank" className="text-sm font-black text-muted transition hover:text-accent">Ver página</Link>
            </div>

            {/* Prévia real do bio site (mesmo componente da página pública,
                sem a chave de edição — ver toPublicSite). pointer-events-none
                porque aqui é vitrine: quem toca quer editar, não navegar. */}
            <div className="px-4">
              <PhoneMockup className="mx-auto h-[320px] w-[220px]">
                <div className="pointer-events-none">
                  <ScaledSitePreview site={toPublicSite(site)} instanceId="painel" cardWidth={220} />
                </div>
              </PhoneMockup>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border">
              <Stat icon={<Eye className="h-5 w-5" />} label="Visitas" value={stats?.views} />
              <Stat icon={<MousePointerClick className="h-5 w-5" />} label="Cliques" value={stats?.clicks} />
              <Stat icon={<UserRound className="h-5 w-5" />} label="Contatos" value={stats?.contacts} />
            </div>
            <p className="flex items-center justify-center gap-2 border-t border-border py-3 text-sm font-semibold text-muted">
              <CalendarDays className="h-4 w-4" /> Últimos 7 dias
            </p>
          </div>

          <Link href={`/editar/${site.slug}`} className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-accent px-6 py-5 text-lg font-black text-white shadow-sm transition hover:bg-accent-dim">
            <Pencil className="h-5 w-5" /> Editar meu bio site
          </Link>
        </>
      ) : (
        <div className="mt-5 rounded-[2rem] border border-dashed border-border p-8 text-center">
          <p className="text-sm font-bold text-muted">Você ainda não tem um bio site.</p>
          <Link href="/app/novo" className="mt-4 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white">Criar meu bio site</Link>
        </div>
      )}
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
