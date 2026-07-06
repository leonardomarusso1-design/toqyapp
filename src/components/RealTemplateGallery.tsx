"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Segment } from "@/lib/types";
import { segmentOptions } from "@/lib/segmentTemplates";
import { cloneRealTemplate } from "@/lib/realTemplates";
import type { TemplatePreview } from "@/lib/realTemplates";
import { fetchShowcaseSite } from "@/lib/showcaseSiteCache";
import type { ToqySite } from "@/lib/types";

const SEGMENT_LABELS = Object.fromEntries(segmentOptions.map((item) => [item.value, item.label])) as Record<Segment, string>;

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}

function TemplateCard({
  preview,
  applying,
  onSelect,
}: {
  preview: TemplatePreview;
  applying: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={applying}
      onClick={() => onSelect(preview.slug)}
      className="card-glow group overflow-hidden rounded-[1.75rem] border border-border bg-white text-left shadow-sm transition hover:border-accent disabled:cursor-wait disabled:opacity-70"
    >
      {/* Card estático (foto + nome) — só busca o site completo ao clicar,
          em vez de renderizar a preview interativa completa pra cada item
          (era pesado e algumas instâncias falhavam ao carregar juntas). */}
      <div
        className="flex h-40 w-full items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${preview.primary}33, ${preview.background})` }}
      >
        {preview.photo ? (
          <img src={preview.photo} alt={preview.name} className="h-20 w-20 rounded-full object-cover shadow-lg" />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg"
            style={{ background: preview.primary }}
          >
            {getInitials(preview.name)}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-ink">{preview.name}</p>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent-dim transition group-hover:bg-accent group-hover:text-white">
          {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {applying ? "Aplicando..." : "Usar este modelo"}
        </p>
      </div>
    </button>
  );
}

export function RealTemplateGallery({ businessName, onApply }: { businessName: string; onApply: (site: ToqySite) => void }) {
  const [previews, setPreviews] = useState<TemplatePreview[] | null>(null);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/real-templates")
      .then((res) => res.json())
      .then((data: { templates?: TemplatePreview[] }) => {
        if (cancelled) return;
        const list = data.templates ?? [];
        setPreviews(list);
        setActiveSegment((current) => current ?? list[0]?.segment ?? null);
      })
      .catch(() => { if (!cancelled) setPreviews([]); });
    return () => { cancelled = true; };
  }, []);

  async function handleSelect(slug: string) {
    if (applyingSlug) return;
    setApplyingSlug(slug);
    const site = await fetchShowcaseSite(slug);
    setApplyingSlug(null);
    if (site) onApply(cloneRealTemplate(site, { name: businessName }));
  }

  if (previews === null) {
    return <p className="mt-5 text-sm font-semibold text-muted">Carregando modelos reais...</p>;
  }

  if (!previews.length) {
    return <p className="mt-5 text-sm font-semibold text-muted">Não foi possível carregar os modelos agora. Você pode continuar e personalizar do zero.</p>;
  }

  const segments = Array.from(new Set(previews.map((t) => t.segment)));
  const visible = previews.filter((t) => t.segment === activeSegment);

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
        {visible.map((preview) => (
          <TemplateCard key={preview.slug} preview={preview} applying={applyingSlug === preview.slug} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
