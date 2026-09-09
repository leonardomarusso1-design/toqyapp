"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { Segment } from "@/lib/types";
import { segmentOptions } from "@/lib/segmentTemplates";
import { cloneRealTemplate } from "@/lib/realTemplates";
import type { TemplatePreview } from "@/lib/realTemplates";
import { fetchShowcaseSite } from "@/lib/showcaseSiteCache";
import { ScaledSitePreview } from "./ScaledSitePreview";
import { PhoneMockup } from "./PhoneMockup";
import type { ToqySite } from "@/lib/types";

const SEGMENT_LABELS = Object.fromEntries(segmentOptions.map((item) => [item.value, item.label])) as Record<Segment, string>;

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}

function TemplateCard({
  preview,
  applying,
  onSelect,
  onPreview,
}: {
  preview: TemplatePreview;
  applying: boolean;
  onSelect: (slug: string) => void;
  onPreview: (slug: string) => void;
}) {
  // Prévia de verdade em vez de só foto+nome (2026-09-09, pedido ao vivo:
  // "aparece os previews dos modelos, para pessoa saber como é" — 9 dos
  // 12 modelos nem têm foto de perfil cadastrada, então o card antigo
  // mostrava só um círculo com iniciais, sem dar noção nenhuma de como o
  // bio site fica). Reusa o MESMO padrão já validado em
  // LandingBioSiteCard.tsx (busca o site completo uma vez via
  // fetchShowcaseSite, que já cacheia — várias dessas prévias já
  // convivem lado a lado na home sem problema): ScaledSitePreview
  // renderiza o PublicBioSite de verdade encolhido, sem precisar de
  // biblioteca de screenshot. Só busca quando a ABA do segmento está
  // visível (RealTemplateGallery só monta os cards do segmento ativo),
  // então nunca são muitos de uma vez.
  const [site, setSite] = useState<ToqySite | null>(null);
  const [failed, setFailed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchShowcaseSite(preview.slug).then((result) => {
      if (cancelled) return;
      if (result) setSite(result); else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [preview.slug]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => setPreviewWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="card-glow group overflow-hidden rounded-[1.75rem] border border-border bg-white text-left shadow-sm transition hover:border-accent">
      {/* Área da prévia: clicável (mesma ação do botão embaixo), mas o
          CONTEÚDO do bio site em si fica pointer-events-none — é só um
          gostinho visual, não dá pra abrir o WhatsApp/link de dentro de
          um modelo de exemplo. */}
      {/* Clicar na área da prévia ABRE o bio site completo pra olhar antes
          de decidir (2026-09-09, pedido ao vivo: "eu queria que embaixo
          de cada um selecionado aparecesse o biosite completo, de como
          ficaria, antes de aplicar") — não aplica mais direto; só o
          botão "Usar este modelo" embaixo aplica. */}
      <div
        ref={previewRef}
        role="button"
        tabIndex={0}
        onClick={() => !applying && onPreview(preview.slug)}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !applying) onPreview(preview.slug); }}
        className={`relative h-56 w-full cursor-pointer overflow-hidden ${applying ? "pointer-events-none opacity-70" : ""}`}
        style={{ background: `linear-gradient(135deg, ${preview.primary}33, ${preview.background})` }}
      >
        {site && previewWidth > 0 ? (
          <div className="pointer-events-none">
            <ScaledSitePreview site={site} instanceId={`template-${preview.slug}`} cardWidth={previewWidth} />
          </div>
        ) : failed ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg" style={{ background: preview.primary }}>
              {getInitials(preview.name)}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-bold text-ink">{preview.name}</p>
        <button
          type="button"
          disabled={applying}
          onClick={() => onSelect(preview.slug)}
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent-dim transition group-hover:bg-accent group-hover:text-white disabled:cursor-wait disabled:opacity-70"
        >
          {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {applying ? "Aplicando..." : "Usar este modelo"}
        </button>
      </div>
    </div>
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
          <TemplateCard key={preview.slug} preview={preview} applying={applyingSlug === preview.slug} onSelect={handleSelect} onPreview={setPreviewingSlug} />
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
