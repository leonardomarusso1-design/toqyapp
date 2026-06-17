"use client";

import { useEffect, useState } from "react";
import type { ToqySite } from "@/lib/types";
import { getSiteBySlug } from "@/lib/siteStorage";
import { getMockSiteBySlug } from "@/lib/mockSites";
import { loadBiositeFromSupabase } from "@/lib/biositeSync";
import { PublicBioSite } from "./PublicBioSite";

export default function StoredPublicBioSite({ slug, initialSite }: { slug: string; initialSite?: ToqySite }) {
  const [site, setSite] = useState<ToqySite | undefined>(initialSite);

  useEffect(() => {
    // 1. Mostra rápido do cache local (localStorage ou mock)
    const local = getSiteBySlug(slug) ?? getMockSiteBySlug(slug) ?? initialSite;
    if (local) setSite(local);

    // 2. Busca versão mais recente do Supabase em background
    loadBiositeFromSupabase(slug).then((supabaseSite) => {
      if (supabaseSite) setSite(supabaseSite);
    });
  }, [slug, initialSite]);

  if (!site) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">TOQY</p>
        <h1 className="mt-3 text-3xl font-black">Bio site não encontrado</h1>
        <p className="mt-2 text-slate-400">Verifique o link ou crie um novo bio site.</p>
      </div>
    </main>
  );

  return <PublicBioSite site={site} />;
}
