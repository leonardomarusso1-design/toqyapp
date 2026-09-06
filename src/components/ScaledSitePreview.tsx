"use client";

import { useEffect, useRef, useState } from "react";
import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";

// Extraído de LandingBioSiteCard (2026-09-06) quando o painel passou a
// mostrar a mesma prévia. Continua sendo o mesmo mecanismo, com a
// largura do card como parâmetro em vez de constante fixa.
//
// PublicBioSite é projetado pra caber numa viewport real (main
// max-w-[430px]) — fontes, paddings e o resto do layout assumem essa
// largura. Um card estreito sem compensação quebra/estoura o texto (nome
// sobrepondo a foto de perfil etc.). Fix: renderiza o site na largura de
// design real e encolhe visualmente com transform: scale — o layout
// interno nunca "vê" a largura pequena, só fica menor na tela.
//
// Bug real corrigido (2026-07-16): a 1ª versão usava overflow-hidden pra
// recortar na altura do card — funcionava visualmente, mas tirava o
// scroll (rodar o mouse sobre a prévia rolava a PÁGINA, não o
// "celular"). PhoneMockup já tem overflow-y-auto embutido; o que faltava
// era o wrapper ter a ALTURA escalada certa (senão, com o filho em
// position:absolute, o pai fica height:0 e não há o que rolar). Mede a
// altura real do conteúdo (scrollHeight, que ignora transform) via
// ResizeObserver e aplica a mesma escala.
export const PHONE_BORDER = 10; // ver PhoneMockup.tsx: border-[10px]
const DESIGN_WIDTH = 390; // largura real que o PublicBioSite espera (~iPhone)

export function ScaledSitePreview({ site, publicUrl, instanceId, cardWidth }: { site: ToqySite; publicUrl?: string; instanceId: string; cardWidth: number }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const scale = (cardWidth - PHONE_BORDER * 2) / DESIGN_WIDTH;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setScaledHeight(el.scrollHeight * scale);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div className="relative w-full" style={{ height: scaledHeight ?? undefined }}>
      <div ref={contentRef} className="absolute left-0 top-0 origin-top-left" style={{ width: DESIGN_WIDTH, transform: `scale(${scale})` }}>
        <PublicBioSite site={site} publicUrl={publicUrl} instanceId={instanceId} />
      </div>
    </div>
  );
}
