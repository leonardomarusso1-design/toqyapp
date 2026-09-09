"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Loader2, X } from "lucide-react";
import type { Segment } from "@/lib/types";
import { segmentOptions } from "@/lib/segmentTemplates";
import { cloneRealTemplate } from "@/lib/realTemplates";
import type { TemplatePreview } from "@/lib/realTemplates";
import { fetchShowcaseSite } from "@/lib/showcaseSiteCache";
import { ScaledSitePreview } from "./ScaledSitePreview";
import { PhoneMockup } from "./PhoneMockup";
import type { ToqySite } from "@/lib/types";

const SEGMENT_LABELS = Object.fromEntries(segmentOptions.map((item) => [item.value, item.label])) as Record<Segment, string>;

// Lista de nomes, sem quadrado de prévia (2026-09-09, pedido ao vivo:
// "tire esse quadrado, e deixe apenas o escrito... e a pessoa clicando,
// já abre direto o preview em baixo, pra ela ver, antes de aplicar") —
// o card com miniatura recortada (h-56) foi substituído por este teste
// anterior de "prévia real por card"; agora nem precisa de miniatura
// nenhuma, o clique no NOME já abre o preview completo (FullTemplatePreview
// abaixo), que é onde a prévia de verdade vive.
function TemplateListItem({
  preview,
  active,
  onClick,
}: {
  preview: TemplatePreview;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
        active ? "border-accent bg-accent/5 text-ink" : "border-border bg-white text-ink hover:border-accent"
      }`}
    >
      {preview.name}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </button>
  );
}

// Prévia completa antes de aplicar (2026-09-09, pedido ao vivo) — clicar
// no card não aplica mais direto, abre este painel com o bio site
// COMPLETO (rolável, sem recorte de altura como o card pequeno) pra
// pessoa decidir com calma. Fica embaixo da grade de cards, span full
// width, mesmo espírito do preview real do editor (PhoneMockup).
function FullTemplatePreview({
  slug,
  applying,
  onApply,
  onClose,
}: {
  slug: string;
  applying: boolean;
  onApply: (slug: string) => void;
  onClose: () => void;
}) {
  const [site, setSite] = useState<ToqySite | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSite(null);
    setFailed(false);
    fetchShowcaseSite(slug).then((result) => {
      if (cancelled) return;
      if (result) setSite(result); else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="mt-5 rounded-[1.75rem] border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-ink">{site?.profile.name ?? "Carregando..."}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={applying || !site}
            onClick={() => onApply(slug)}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-black text-white transition hover:bg-accent-dim disabled:cursor-wait disabled:opacity-70"
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {applying ? "Aplicando..." : "Usar este modelo"}
          </button>
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mx-auto mt-4 w-[280px] max-w-full">
        {site ? (
          <PhoneMockup className="h-[70vh] max-h-[720px] w-full">
            <ScaledSitePreview site={site} instanceId={`template-preview-${slug}`} cardWidth={280} />
          </PhoneMockup>
        ) : failed ? (
          <p className="pt-10 text-center text-sm font-semibold text-muted">Não foi possível carregar este modelo agora.</p>
        ) : (
          <div className="flex h-[70vh] max-h-[720px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
        )}
      </div>
    </div>
  );
}

export function RealTemplateGallery({ businessName, onApply }: { businessName: string; onApply: (site: ToqySite) => void }) {
  const [previews, setPreviews] = useState<TemplatePreview[] | null>(null);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);
  const [previewingSlug, setPreviewingSlug] = useState<string | null>(null);

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
            onClick={() => { setActiveSegment(segment); setPreviewingSlug(null); }}
            className={`rounded-full border px-4 py-2 text-xs font-black transition ${
              activeSegment === segment ? "border-accent bg-accent text-white" : "border-border bg-white text-ink hover:border-accent"
            }`}
          >
            {SEGMENT_LABELS[segment] ?? segment}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((preview) => (
          <TemplateListItem key={preview.slug} preview={preview} active={previewingSlug === preview.slug} onClick={() => setPreviewingSlug(preview.slug)} />
        ))}
      </div>

      {previewingSlug ? (
        <FullTemplatePreview
          slug={previewingSlug}
          applying={applyingSlug === previewingSlug}
          onApply={handleSelect}
          onClose={() => setPreviewingSlug(null)}
        />
      ) : null}
    </div>
  );
}
