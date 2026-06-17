"use client";

import { useEffect, useState } from "react";
import type { ToqySite } from "@/lib/types";
import { getSiteBySlug } from "@/lib/siteStorage";
import { loadBiositeFromSupabase } from "@/lib/biositeSync";
import { PublicBioSite } from "./PublicBioSite";

export default function StoredPublicBioSite({ slug }: { slug: string }) {
  const [site, setSite] = useState<ToqySite | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      // Busca exclusivamente do Supabase
      const supabaseSite = await loadBiositeFromSupabase(slug);
      if (!active) return;
      if (supabaseSite) {
        setSite(supabaseSite);
      } else {
        // fallback: cache local apenas se o próprio criador estiver vendo
        const local = getSiteBySlug(slug);
        if (local) setSite(local);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </main>
    );
  }

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
