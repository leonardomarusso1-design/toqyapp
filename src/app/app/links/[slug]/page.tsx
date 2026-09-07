"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, MousePointerClick } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { buttonHref } from "@/lib/buttonUtils";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

// "Meus Links" (2026-09-07, referência Coonexta — item próprio dentro
// do grupo "Análise", separado do ranking geral de botões que já existe
// em /app/analytics/[slug]). Aqui é a lista de TODOS os links
// configurados neste bio site (mesmo os com zero clique), com pra onde
// cada um aponta — não só um recorte de período. Cliques vêm da mesma
// toqy_analytics_events, contados desde sempre (sem filtro de data).
type RawEvent = { button_label: string | null };

export default function SiteLinksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [site, setSite] = useState<ToqySite | null>(null);
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const sites = await listBiositesFromSupabase();
      const found = sites.find((s) => s.slug === slug) ?? null;
      if (!active) return;
      setSite(found);
      if (!found) { setLoading(false); return; }

      const { data } = await supabase
        .from("toqy_analytics_events")
        .select("button_label")
        .eq("bio_site_id", found.id)
        .neq("event_type", "page_view");
      if (!active) return;
      setEvents((data ?? []) as RawEvent[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  const clicksByLabel = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      const label = e.button_label;
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  const links = useMemo(() => {
    if (!site) return [];
    return site.buttons
      .map((button) => ({ button, href: buttonHref(site, button), clicks: clicksByLabel.get(button.label) ?? 0 }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [site, clicksByLabel]);

  return (
    <DashboardShell>
      <Link href="/app/analytics" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Todos os bio sites
      </Link>

      <div className="mt-4">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Meus Links</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink md:text-4xl">{loading ? "Carregando..." : site?.profile.name ?? slug}</h1>
        <p className="mt-2 text-sm text-muted">Todos os botões deste bio site e quantos cliques cada um já recebeu.</p>
      </div>

      {!loading && !site ? (
        <p className="mt-8 text-sm text-muted">Bio site não encontrado.</p>
      ) : !loading && links.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-border p-10 text-center">
          <Link2 className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-bold text-muted">Nenhum link cadastrado ainda. Adicione na etapa Links e Botões.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {links.map(({ button, href, clicks }) => (
            <div key={button.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-black text-ink">{button.label}</p>
                <p className="truncate text-xs font-semibold text-muted">{href || "Sem destino configurado"}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-black text-accent">
                <MousePointerClick className="h-3.5 w-3.5" /> {clicks}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
