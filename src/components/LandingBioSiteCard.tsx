"use client";

import { ExternalLink } from "lucide-react";
import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

export function LandingBioSiteCard({ site, publicUrl }: { site: ToqySite; publicUrl: string }) {
  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noreferrer"
      className="card-glow group block rounded-[2rem] border border-border bg-card p-4 shadow-sm"
    >
      <PhoneMockup className="mx-auto h-[480px] w-full max-w-[240px]">
        <PublicBioSite site={site} publicUrl={publicUrl} instanceId={site.slug} />
      </PhoneMockup>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="truncate font-bold text-ink">{site.profile.name}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent-dim transition group-hover:text-accent">
          Ver biosite real <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  );
}
