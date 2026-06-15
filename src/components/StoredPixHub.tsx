"use client";

import { useEffect, useState } from "react";
import type { ToqySite } from "@/lib/types";
import { getBiositeBySlug } from "@/lib/dataProvider";
import { PixHub } from "./PixHub";

export default function StoredPixHub({ slug, initialSite }: { slug: string; initialSite?: ToqySite }) {
  const [site, setSite] = useState<ToqySite | undefined>(initialSite);

  useEffect(() => {
    setSite(getBiositeBySlug(slug) ?? initialSite);
  }, [slug, initialSite]);

  if (!site) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-white">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">TOQY</p>
          <h1 className="mt-3 text-3xl font-black">Pix Hub nao encontrado</h1>
          <p className="mt-2 text-slate-400">Verifique o link ou crie um novo bio site.</p>
        </div>
      </main>
    );
  }

  return <PixHub site={site} />;
}
