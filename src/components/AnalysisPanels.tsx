"use client";

// Conteúdo de "Estatísticas" / "Meus Links" / "Cadastros" / "Agendamentos"
// extraído das páginas cheias (2026-09-08, bug real reportado ao vivo:
// "quando entro no /me pelo cliente, aparece o painel estatísticas e
// tal.. mas quando clico ele volta la pro analytics ou agendamentos, ele
// vai muda todo o menu / poderia apenas abrir do lado da tela as coisas,
// mas muda todos os menus, tem que ficar voltando pagina"). Antes, cada
// item da sidebar "Análise" navegava pra uma página cheia própria
// (/app/analytics/[slug], /app/links/[slug], /app/leads?site=,
// /app/bookings?site=), cada uma com seu layout/menu do DashboardShell —
// trocava o menu inteiro da tela, exigindo "voltar" pra continuar
// editando. Agora esses 4 componentes recebem `site` direto (o editor
// já tem o objeto carregado, sem precisar de listBiositesFromSupabase)
// e são renderizados dentro de um painel deslizante (ver AnalysisDrawer
// em SiteBuilder.tsx), sem navegar pra lugar nenhum.
//
// As páginas cheias originais continuam existindo (usadas quando o dono
// acessa /app/analytics, /app/leads etc. direto pelo menu principal do
// dashboard, fora do editor de um site específico) — este arquivo não
// duplica lógica de busca de site, só o CONTEÚDO de cada painel.
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Eye, Inbox, Link2, Mail, MessageCircle, MessageSquare, MousePointerClick, Percent, Phone, Smartphone, StickyNote, Trash2 } from "lucide-react";
import { buttonHref } from "@/lib/buttonUtils";
import { supabase } from "@/lib/supabaseClient";
import { categorizeReferer, isMobileUserAgent, periodRange, PERIOD_OPTIONS, type PeriodId, type TrafficOrigin } from "@/lib/analyticsInsights";
import type { ToqySite } from "@/lib/types";

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</span>
      <p className="mt-2.5 text-2xl font-black text-ink">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

type RawAnalyticsEvent = { event_type: string; button_label: string | null; user_agent: string | null; referer: string | null; created_at: string };

export function AnalyticsPanel({ site }: { site: ToqySite }) {
  const [events, setEvents] = useState<RawAnalyticsEvent[]>([]);
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [loading, setLoading] = useState(true);
  const range = useMemo(() => periodRange(period), [period]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("toqy_analytics_events")
        .select("event_type, button_label, user_agent, referer, created_at")
        .eq("bio_site_id", site.id)
        .gte("created_at", range.from);
      if (range.to) query = query.lt("created_at", range.to);
      const { data } = await query;
      if (!active) return;
      setEvents((data ?? []) as RawAnalyticsEvent[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [site.id, range.from, range.to]);

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
    const mobilePct = views.length > 0 ? Math.round((mobileViews / views.length) * 100) : 0;
    const desktopPct = views.length > 0 ? 100 - mobilePct : 0;

    return { views: views.length, clicks: clicks.length, conversion, origins, buttons, mobilePct, desktopPct };
  }, [events]);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_OPTIONS.map((opt) => (
          <button key={opt.id} type="button" onClick={() => setPeriod(opt.id)} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${period === opt.id ? "bg-accent text-white" : "border border-border bg-card text-muted hover:border-accent"}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Carregando...</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard icon={<Eye className="h-4.5 w-4.5" />} label="Visitas" value={insights.views} />
            <StatCard icon={<MousePointerClick className="h-4.5 w-4.5" />} label="Cliques em links" value={insights.clicks} />
            <StatCard icon={<Percent className="h-4.5 w-4.5" />} label="Taxa de conversão" value={`${insights.conversion}%`} hint="cliques / visitas" />
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Smartphone className="h-4.5 w-4.5" /></span>
              <div className="mt-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-ink"><span>Mobile</span><span className="font-black">{insights.mobilePct}%</span></div>
                <div className="flex items-center justify-between font-bold text-ink"><span>Desktop</span><span className="font-black">{insights.desktopPct}%</span></div>
              </div>
            </div>
          </div>

          <section className="mt-5">
            <h3 className="text-sm font-black text-ink">Origem do tráfego</h3>
            {insights.origins.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sem visitas no período.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {insights.origins.map(([origin, count]) => (
                  <div key={origin} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                    <span className="text-sm font-bold text-ink">{origin}</span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-black text-accent">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-black text-ink">Ranking dos botões</h3>
            {insights.buttons.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Sem cliques no período.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {insights.buttons.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                    <span className="truncate text-sm font-bold text-ink">{label}</span>
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-black text-accent">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

type RawClickEvent = { button_label: string | null };

export function LinksPanel({ site }: { site: ToqySite }) {
  const [events, setEvents] = useState<RawClickEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("toqy_analytics_events")
        .select("button_label")
        .eq("bio_site_id", site.id)
        .neq("event_type", "page_view");
      if (!active) return;
      setEvents((data ?? []) as RawClickEvent[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [site.id]);

  const links = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) { if (e.button_label) counts.set(e.button_label, (counts.get(e.button_label) ?? 0) + 1); }
    return site.buttons
      .map((button) => ({ button, href: buttonHref(site, button), clicks: counts.get(button.label) ?? 0 }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [site, events]);

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (links.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Link2 className="mx-auto h-7 w-7 text-muted" />
        <p className="mt-3 text-sm font-bold text-muted">Nenhum link cadastrado ainda. Adicione na etapa Links e Botões.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {links.map(({ button, href, clicks }) => (
        <div key={button.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="truncate font-black text-ink">{button.label}</p>
            <p className="truncate text-xs font-semibold text-muted">{href || "Sem destino configurado"}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black text-accent">
            <MousePointerClick className="h-3.5 w-3.5" /> {clicks}
          </span>
        </div>
      ))}
    </div>
  );
}

type Lead = { id: string; name: string; email: string | null; phone: string | null; message: string | null; created_at: string };

export function LeadsPanel({ site }: { site: ToqySite }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("toqy_leads")
        .select("id, name, email, phone, message, created_at")
        .eq("bio_site_id", site.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setLeads((data ?? []) as Lead[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [site.id]);

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Inbox className="mx-auto h-7 w-7 text-muted" />
        <p className="mt-3 text-sm font-bold text-muted">Nenhum contato recebido ainda.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <div key={lead.id} className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-black text-ink">{lead.name}</p>
            <p className="text-[11px] font-semibold text-muted">{new Date(lead.created_at).toLocaleString("pt-BR")}</p>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted">
            {lead.email ? <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{lead.email}</span> : null}
            {lead.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lead.phone}</span> : null}
          </div>
          {lead.message ? <p className="mt-1.5 inline-flex items-start gap-1.5 text-sm text-ink"><MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />{lead.message}</p> : null}
        </div>
      ))}
    </div>
  );
}

type Booking = { id: string; service_name: string; customer_name: string; customer_phone: string; notes: string | null; booking_date: string; booking_time: string };

function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export function BookingsPanel({ site }: { site: ToqySite }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("toqy_bookings")
        .select("id, service_name, customer_name, customer_phone, notes, booking_date, booking_time")
        .eq("bio_site_id", site.id)
        .eq("status", "confirmed")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (!active) return;
      setBookings((data ?? []) as Booking[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [site.id]);

  async function deleteBooking(bookingId: string) {
    if (!confirm("Excluir esta reserva? Não tem como desfazer.")) return;
    setDeletingId(bookingId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    setDeletingId(null);
    if (!res.ok) { alert("Não foi possível excluir. Tente novamente."); return; }
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <CalendarClock className="mx-auto h-7 w-7 text-muted" />
        <p className="mt-3 text-sm font-bold text-muted">Nenhuma reserva ainda.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <div key={booking.id} className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-black text-ink">{booking.customer_name} <span className="font-semibold text-muted">— {booking.service_name}</span></p>
            <p className="text-[11px] font-semibold text-muted">{booking.booking_date.split("-").reverse().join("/")} às {booking.booking_time.slice(0, 5)}</p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{booking.customer_phone}</span>
            <a href={whatsappLink(booking.customer_phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:underline">
              <MessageCircle className="h-3.5 w-3.5" />WhatsApp
            </a>
            <button type="button" onClick={() => deleteBooking(booking.id)} disabled={deletingId === booking.id} className="inline-flex items-center gap-1.5 font-bold text-red-600 hover:underline disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />{deletingId === booking.id ? "Excluindo..." : "Excluir"}
            </button>
          </div>
          {booking.notes ? <p className="mt-1.5 inline-flex items-start gap-1.5 text-sm text-ink"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />{booking.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
