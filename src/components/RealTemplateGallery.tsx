"use client";

import { useEffect, useState } from "react";
import type { Segment, ToqySite } from "@/lib/types";
import { segmentOptions } from "@/lib/segmentTemplates";
import { cloneRealTemplate } from "@/lib/realTemplates";
import { fetchShowcaseSite } from "@/lib/showcaseSiteCache";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

const SEGMENT_LABELS = Object.fromEntries(segmentOptions.map((item) => [item.value, item.label])) as Record<Segment, string>;

type Summary = { slug: string; segment: Segment };

function TemplateCard({ slug, businessName, onApply }: { slug: string; businessName: string; onApply: (site: ToqySite) => void }) {
  const [site, setSite] = useState<ToqySite | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShowcaseSite(slug).then((result) => { if (!cancelled) setSite(result); });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <button
      type="button"
      disabled={!site}
      onClick={() => site && onApply(cloneRealTemplate(site, { name: businessName }))}
      className="card-glow group rounded-[1.75rem] border border-border bg-white p-3 text-left shadow-sm transition hover:border-accent disabled:cursor-wait disabled:opacity-70"
    >
      <PhoneMockup className="mx-auto h-80 w-full max-w-[180px]">
        {site ? (
          <PublicBioSite site={site} publicUrl={`https://www.toqy.com.br/b/${slug}`} instanceId={`gallery-${slug}`} />
        ) : (
          <div className="flex h-full items-center justify-center bg-ink/40">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
      </PhoneMockup>
      <p className="mt-3 truncate text-sm font-bold text-ink">{site?.profile.name ?? slug}</p>
      <p className="mt-2 inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent-dim transition group-hover:bg-accent group-hover:text-white">
        {site ? "Usar este modelo" : "Carregando..."}
      </p>
    </button>
  );
}

export function RealTemplateGallery({ businessName, onApply }: { businessName: string; onApply: (site: ToqySite) => void }) {
  const [summaries, setSummaries] = useState<Summary[] | null>(null);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/real-templates")
      .then((res) => res.json())
      .then((data: { templates?: Summary[] }) => {
        if (cancelled) return;
        const list = data.templates ?? [];
        setSummaries(list);
        setActiveSegment((current) => current ?? list[0]?.segment ?? null);
      })
      .catch(() => { if (!cancelled) setSummaries([]); });
    return () => { cancelled = true; };
  }, []);

  if (summaries === null) {
    return <p className="mt-5 text-sm font-semibold text-muted">Carregando modelos reais...</p>;
  }

  if (!summaries.length) {
    return <p className="mt-5 text-sm font-semibold text-muted">Não foi possível carregar os modelos agora. Você pode continuar e personalizar do zero.</p>;
  }

  const segments = Array.from(new Set(summaries.map((t) => t.segment)));
  const visible = summaries.filter((t) => t.segment === activeSegment);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        {segments.map((segment) => (
          <button
            key={segment}
            type="button"
            onClick={() => setActiveSegment(segment)}
            className={`rounded-full border px-4 py-2 text-xs font-black transition ${
              activeSegment === segment ? "border-accent bg-accent text-white" : "border-border bg-white text-ink hover:border-accent"
            }`}
          >
            {SEGMENT_LABELS[segment] ?? segment}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((summary) => (
          <TemplateCard key={summary.slug} slug={summary.slug} businessName={businessName} onApply={onApply} />
        ))}
      </div>
    </div>
  );
}
