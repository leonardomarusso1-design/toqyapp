"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { ToqySite } from "@/lib/types";
import { fetchShowcaseSite } from "@/lib/showcaseSiteCache";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

// PublicBioSite é projetado pra caber numa viewport real (main
// max-w-[430px], ver PublicBioSite.tsx) — fontes, paddings e o resto do
// layout assumem essa largura. Este card da landing é só 190px de fora
// (menos 170px de conteúdo, descontando a borda de 10px do PhoneMockup),
// então sem compensação o texto quebrava/estourava a moldura (nome
// sobrepondo a foto de perfil etc.). Fix: renderiza o site na largura de
// design real e encolhe visualmente com transform: scale — o layout
// interno do PublicBioSite nunca "vê" 190px, só fica menor na tela.
const CARD_WIDTH = 190; // deve ficar em sincronia com a classe w-[190px] no <a> abaixo
const PHONE_BORDER = 10; // ver PhoneMockup.tsx: border-[10px]
const DESIGN_WIDTH = 390; // largura real que o PublicBioSite espera (~iPhone)
const VISIBLE_WIDTH = CARD_WIDTH - PHONE_BORDER * 2;
const PREVIEW_SCALE = VISIBLE_WIDTH / DESIGN_WIDTH;

// Bug real corrigido (2026-07-16): a 1ª versão deste fix usava
// overflow-hidden pra recortar o preview na altura do card — funcionava
// visualmente, mas tirava o scroll (rodar o mouse sobre o preview passou a
// rolar a PÁGINA inteira, não o "celular"). PhoneMockup já tem
// overflow-y-auto embutido; o que faltava era o wrapper ter a ALTURA
// escalada certa (senão, com o filho em position:absolute, o pai fica
// height:0 e não há o que rolar). Mede a altura real do conteúdo
// (scrollHeight, que ignora transform) via ResizeObserver e aplica a
// mesma escala — o navegador então tem uma área real pra rolar dentro do
// mockup, exatamente como um celular de verdade.
function ScaledSitePreview({ site, publicUrl, instanceId }: { site: ToqySite; publicUrl: string; instanceId: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setScaledHeight(el.scrollHeight * PREVIEW_SCALE);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full" style={{ height: scaledHeight ?? undefined }}>
      <div ref={contentRef} className="absolute left-0 top-0 origin-top-left" style={{ width: DESIGN_WIDTH, transform: `scale(${PREVIEW_SCALE})` }}>
        <PublicBioSite site={site} publicUrl={publicUrl} instanceId={instanceId} />
      </div>
    </div>
  );
}

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
          <ScaledSitePreview site={site} publicUrl={publicUrl} instanceId={slug} />
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
