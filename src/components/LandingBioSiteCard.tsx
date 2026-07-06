"use client";

import { ExternalLink } from "lucide-react";
import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

export function LandingBioSiteCard({ site, publicUrl }: { site: ToqySite; publicUrl: string }) {
  return (
    <a href={publicUrl} target="_blank" rel="noreferrer" className="group block w-[190px] shrink-0 snap-start">
      <PhoneMockup className="mx-auto h-[380px] w-full transition duration-300 group-hover:-translate-y-1">
        <PublicBioSite site={site} publicUrl={publicUrl} instanceId={site.slug} />
      </PhoneMockup>
      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <p className="truncate text-sm font-bold text-ink">{site.profile.name}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent-dim transition group-hover:text-accent">
          Ver <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  );
}
