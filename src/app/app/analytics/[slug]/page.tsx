"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, MousePointerClick, Percent, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { buildDailySeries, categorizeReferer, isMobileUserAgent, periodRange, PERIOD_OPTIONS, type PeriodId, type TrafficOrigin } from "@/lib/analyticsInsights";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

// Análise por bio site (2026-09-07, referência Coonexta — documento de
// análise do concorrente: "origem do tráfego, evolução, ranking dos
// botões, mobile x desktop e taxa de conversão", com filtro de período
// Hoje/Ontem/7/15/30 dias/Máximo). A tabela toqy_analytics_events já
// grava referer/user_agent/button_label desde 2026-07-16 — o que
// faltava era agregar e mostrar, não coletar mais dado.
//
// Bug real corrigido no mesmo dia (2026-09-07): "Cliques" e "Taxa de
// conversão" sempre davam 0 porque PublicBioSite.tsx nunca chamava
// analytics.trackButtonClick pra nenhum botão — só o page_view era
// gravado. Ver eventTypeForButtonType em lib/analytics.ts.
type RawEvent = { event_type: string; button_label: string | null; user_agent: string | null; referer: string | null; created_at: string };

export default function SiteAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [site, setSite] = useState<ToqySite | null>(null);
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [loading, setLoading] = useState(true);
  const range = useMemo(() => periodRange(period), [period]);

  useEffect(() => {
    let active = true;
    (async () => {
      const sites = await listBiositesFromSupabase();
      const found = sites.find((s) => s.slug === slug) ?? null;
      if (!active) return;
      setSite(found);
      if (!found) { setLoading(false); return; }

      let query = supabase
        .from("toqy_analytics_events")
        .select("event_type, button_label, user_agent, referer, created_at")
        .eq("bio_site_id", found.id)
        .gte("created_at", range.from);
      if (range.to) query = query.lt("created_at", range.to);
      const { data } = await query;
      if (!active) return;
      setEvents((data ?? []) as RawEvent[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug, range.from, range.to]);

  const insights = useMemo(() => {
    const views = events.filter((e) => e.event_type === "page_view");
    const clicks = events.filter((e) => e.event_type !== "page_view");
    const conversion = views.length > 0 ? Math.round((clicks.length / views.length) * 100) : 0;

    const originCounts = new Map<TrafficOrigin, number>();
    for (const e of views) {
      const origin = categorizeReferer(e.referer);
      originCounts.set(origin, (originCounts.get(origin) ?? 0) + 1);
    }
    const origins = [...originCounts.entries()].sort((a, b) => b[1] - a[1]);

    const buttonCounts = new Map<string, number>();
    for (const e of clicks) {
      const label = e.button_label || e.event_type;
      buttonCounts.set(label, (buttonCounts.get(label) ?? 0) + 1);
    }
    const buttons = [...buttonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    const mobileViews = views.filter((e) => isMobileUserAgent(e.user_agent)).length;
    const desktopViews = views.length - mobileViews;
    const mobilePct = views.length > 0 ? Math.round((mobileViews / views.length) * 100) : 0;
    const desktopPct = views.length > 0 ? 100 - mobilePct : 0;

    const series = buildDailySeries(events, range.from, range.to);

    return { views: views.length, clicks: clicks.length, conversion, origins, buttons, mobileViews, desktopViews, mobilePct, desktopPct, series };
  }, [events, range.from, range.to]);

  return (
    <DashboardShell>
      <Link href="/app/analytics" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Todos os bio sites
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Estatísticas</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink md:text-4xl">{loading ? "Carregando..." : site?.profile.name ?? slug}</h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button key={opt.id} type="button" onClick={() => setPeriod(opt.id)} className={`rounded-full px-3.5 py-2 text-xs font-black transition ${period === opt.id ? "bg-accent text-white" : "border border-border bg-card text-muted hover:border-accent"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && !site ? (
        <p className="mt-8 text-sm text-muted">Bio site não encontrado.</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Eye className="h-5 w-5" />} label="Visitas" value={insights.views} />
            <StatCard icon={<MousePointerClick className="h-5 w-5" />} label="Cliques em links" value={insights.clicks} />
            <StatCard icon={<Percent className="h-5 w-5" />} label="Taxa de conversão" value={`${insights.conversion}%`} hint="cliques / visitas" />
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Smartphone className="h-5 w-5" /></span>
              <p className="mt-3 text-sm font-bold text-muted">Dispositivos</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-sm"><span className="font-bold text-ink">Mobile</span><span className="font-black text-ink">{insights.mobilePct}%</span></div>
                <div className="flex items-center justify-between text-sm"><span className="font-bold text-ink">Desktop</span><span className="font-black text-ink">{insights.desktopPct}%</span></div>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-black text-ink">Visitas e cliques ao longo do tempo</h2>
            <TimeSeriesChart series={insights.series} />
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-black text-ink">Origem do tráfego</h2>
              <p className="mt-1 text-sm text-muted">De onde vieram as visitas neste período.</p>
              {insights.origins.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Sem visitas no período.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {insights.origins.map(([origin, count]) => (
                    <div key={origin} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
                      <span className="text-sm font-bold text-ink">{origin}</span>
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black text-accent">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-black text-ink">Ranking dos botões</h2>
              <p className="mt-1 text-sm text-muted">Quais links receberam mais clique.</p>
              {insights.buttons.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Sem cliques no período.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {insights.buttons.map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
                      <span className="truncate text-sm font-bold text-ink">{label}</span>
                      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black text-accent">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">{icon}</span>
      <p className="mt-3 text-3xl font-black text-ink">{value}</p>
      <p className="text-sm font-bold text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

// Gráfico de linha sem dependência nova (2026-09-07) — SVG puro, mesmo
// espírito do resto do projeto (evita adicionar uma lib de chart só pra
// 2 linhas). Eixo Y auto-escalado pelo maior valor da série.
function TimeSeriesChart({ series }: { series: Array<{ label: string; views: number; clicks: number }> }) {
  if (series.length === 0) return <p className="mt-4 text-sm text-muted">Sem dados — compartilhe seu link e as métricas aparecerão aqui.</p>;

  const width = 900;
  const height = 220;
  const padding = 24;
  const max = Math.max(1, ...series.map((d) => Math.max(d.views, d.clicks)));
  const stepX = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
  const y = (v: number) => height - padding - (v / max) * (height - padding * 2);
  const line = (key: "views" | "clicks") => series.map((d, i) => `${i === 0 ? "M" : "L"} ${padding + i * stepX} ${y(d[key])}`).join(" ");

  // Mostra no máximo ~12 labels no eixo X, mesmo com mais dias que isso
  const labelEvery = Math.max(1, Math.ceil(series.length / 12));

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full min-w-[600px]" preserveAspectRatio="none">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-border" strokeWidth={1} />
        <path d={line("views")} fill="none" stroke="var(--color-accent, #0b7a55)" strokeWidth={2.5} />
        <path d={line("clicks")} fill="none" stroke="#7c3aed" strokeWidth={2.5} />
        {series.map((d, i) => (i % labelEvery === 0 ? (
          <text key={d.label} x={padding + i * stepX} y={height + 16} textAnchor="middle" className="fill-current text-muted" fontSize={11} fontWeight={700}>{d.label}</text>
        ) : null))}
      </svg>
      <div className="mt-2 flex justify-center gap-5 text-xs font-bold text-muted">
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-accent" />Visitas</span>
        <span><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-violet" />Cliques</span>
      </div>
    </div>
  );
}
