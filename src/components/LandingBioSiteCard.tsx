"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { ToqySite } from "@/lib/types";
import { fetchShowcaseSite } from "@/lib/showcaseSiteCache";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

// Cada card busca o próprio conteúdo (com fotos) no navegador, depois da
// página carregar — evita embutir os 12 site_data completos (imagens em
// base64) na página estática "/" (isso já estourou o limite de tamanho do
// ISR na Vercel uma vez: 36MB numa página só).
export function LandingBioSiteCard({ slug, publicUrl }: { slug: string; publicUrl: string }) {
  const [site, setSite] = useState<ToqySite | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchShowcaseSite(slug).then((result) => {
      if (cancelled) return;
      if (result) setSite(result);
      else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <a href={publicUrl} target="_blank" rel="noreferrer" className="group block w-[190px] shrink-0 snap-start">
      <PhoneMockup className="mx-auto h-[380px] w-full transition duration-300 group-hover:-translate-y-1">
        {site ? (
          <PublicBioSite site={site} publicUrl={publicUrl} instanceId={slug} />
        ) : (
          <div className="flex h-full items-center justify-center bg-ink/40 px-4 text-center">
            {failed ? (
              <p className="text-xs font-semibold text-white/70">Não foi possível carregar o preview</p>
            ) : (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
          </div>
        )}
      </PhoneMockup>
      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <p className="truncate text-sm font-bold text-ink">{site?.profile.name ?? slug}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent-dim transition group-hover:text-accent">
          Ver <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  );
}
