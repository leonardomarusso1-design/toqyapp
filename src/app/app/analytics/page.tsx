"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Lock } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { getPlan, resolvePlanTier } from "@/lib/subscriptions";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

// Analytics real (2026-07-16) — antes desta tela, o plano prometia
// "Analytics" mas não existia NADA pra ver: /api/analytics/track
// descartava o evento, e nenhuma tela chamava o tracker. Agora que
// page_view é gravado de verdade (PublicBioSite.tsx), esta tela mostra o
// total por bio site. Versão mínima de propósito — cliques por botão,
// gráfico por período e funil ficam pra uma próxima etapa.
type SiteStats = { site: ToqySite; views: number };

export default function AnalyticsPage() {
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [stats, setStats] = useState<SiteStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [{ data: profile }, sites] = await Promise.all([
        supabase.from("profiles").select("plan_toqy, plan_tier").eq("id", session.user.id).maybeSingle(),
        listBiositesFromSupabase(),
      ]);
      if (!active) return;
      setPlanTier(profile?.plan_toqy || profile?.plan_tier || "free");

      const results = await Promise.all(
        sites.map(async (site) => {
          const { count } = await supabase
            .from("toqy_analytics_events")
            .select("id", { count: "exact", head: true })
            .eq("bio_site_id", site.id)
            .eq("event_type", "page_view");
          return { site, views: count ?? 0 };
        })
      );
      if (!active) return;
      setStats(results);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const plan = getPlan(resolvePlanTier(planTier));

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Analytics</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">Visualizações dos seus bio sites</h1>
        <p className="mt-2 max-w-2xl text-muted">Quantas vezes cada bio site foi aberto — contado em tempo real toda vez que alguém acessa a página pública.</p>
      </div>

      {!plan.hasAnalytics ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-accent/40 bg-accent/5 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-3 text-lg font-black text-ink">Recurso do plano pago</p>
          <p className="mt-1 text-sm text-muted">Analytics está disponível a partir do plano Essencial.</p>
          <Link href="/#planos" className="mt-4 inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white">Ver planos</Link>
        </div>
      ) : loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : stats.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nenhum bio site criado ainda.</p>
      ) : (
        <div className="mt-8 space-y-3">
          {stats.map(({ site, views }) => (
            <div key={site.slug} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
              <div>
                <p className="font-black text-ink">{site.profile.name}</p>
                <p className="text-sm text-muted">/{site.slug}</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-2 text-accent">
                <Eye className="h-4 w-4" />
                <span className="font-black">{views}</span>
                <span className="text-sm font-bold">visualizações</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
