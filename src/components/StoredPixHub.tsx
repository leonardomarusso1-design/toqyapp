"use client";

import { useEffect, useState } from "react";
import type { ToqySite } from "@/lib/types";
import { getSiteBySlug } from "@/lib/siteStorage";
import { loadBiositeFromSupabase } from "@/lib/biositeSync";
import { getPlan, resolvePlanTier } from "@/lib/subscriptions";
import { PixHub } from "./PixHub";

export default function StoredPixHub({ slug }: { slug: string }) {
  const [site, setSite] = useState<ToqySite | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const supabaseSite = await loadBiositeFromSupabase(slug);
      if (!active) return;
      if (supabaseSite) setSite(supabaseSite);
      else { const local = getSiteBySlug(slug); if (local) setSite(local); }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [slug]);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" /></main>;

  if (!site) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-white">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">TOQY</p>
        <h1 className="mt-3 text-3xl font-black">Página não encontrada</h1>
      </div>
    </main>
  );

  // Gating real de plano (2026-07-13) — esta rota (/[slug]/pix) é um
  // caminho INDEPENDENTE do modal de Pix dentro de PublicBioSite.tsx (dá
  // pra acessar direto pela URL, sem passar pelo botão gateado). Sem essa
  // checagem, um bio site do plano Gratuito continuaria com Pix funcional
  // completo só não tendo o botão visível na página principal.
  if (!getPlan(resolvePlanTier(site.ownerPlan)).hasPix) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-white">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">TOQY</p>
          <h1 className="mt-3 text-3xl font-black">Pix não disponível</h1>
          <p className="mt-2 text-slate-400">Este recurso não está incluso no plano deste bio site.</p>
        </div>
      </main>
    );
  }

  return <PixHub site={site} />;
}
