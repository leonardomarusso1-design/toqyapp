"use client";

import { useEffect, useState } from "react";
import type { Segment, ToqySite } from "@/lib/types";
import { segmentOptions } from "@/lib/segmentTemplates";
import { cloneRealTemplate } from "@/lib/realTemplates";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

const SEGMENT_LABELS = Object.fromEntries(segmentOptions.map((item) => [item.value, item.label])) as Record<Segment, string>;

export function RealTemplateGallery({ businessName, onApply }: { businessName: string; onApply: (site: ToqySite) => void }) {
  const [templates, setTemplates] = useState<ToqySite[] | null>(null);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/real-templates")
      .then((res) => res.json())
      .then((data: { templates?: ToqySite[] }) => {
        if (cancelled) return;
        const list = data.templates ?? [];
        setTemplates(list);
        setActiveSegment((current) => current ?? list[0]?.segment ?? null);
      })
      .catch(() => { if (!cancelled) setTemplates([]); });
    return () => { cancelled = true; };
  }, []);

  if (templates === null) {
    return <p className="mt-5 text-sm font-semibold text-muted">Carregando modelos reais...</p>;
  }

  if (!templates.length) {
    return <p className="mt-5 text-sm font-semibold text-muted">Não foi possível carregar os modelos agora. Você pode continuar e personalizar do zero.</p>;
  }

  const segments = Array.from(new Set(templates.map((t) => t.segment)));
  const visibleTemplates = templates.filter((t) => t.segment === activeSegment);

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
        {visibleTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onApply(cloneRealTemplate(template, { name: businessName }))}
            className="card-glow group rounded-[1.75rem] border border-border bg-white p-3 text-left shadow-sm transition hover:border-accent"
          >
            <PhoneMockup className="mx-auto h-80 w-full max-w-[180px]">
              <PublicBioSite site={template} publicUrl={`https://www.toqy.com.br/b/${template.slug}`} instanceId={`gallery-${template.slug}`} />
            </PhoneMockup>
            <p className="mt-3 truncate text-sm font-bold text-ink">{template.profile.name}</p>
            <p className="mt-2 inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent-dim transition group-hover:bg-accent group-hover:text-white">
              Usar este modelo
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
