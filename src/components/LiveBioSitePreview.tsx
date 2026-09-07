"use client";

import { useState } from "react";
import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";
import { BrowserMockup } from "./BrowserMockup";

// Toggle Mobile/Desktop (2026-09-07, referência Coonexta — "PREVIEW AO
// VIVO" com pílulas Mobile/Desktop no canto). O bio site em si continua
// sendo uma página mobile (max-w-[430px] centralizado, ver
// PublicBioSite.tsx) — o que muda é só a MOLDURA ao redor: celular ou
// janela de navegador. É assim que o produto real se comporta: abrir
// /b/[slug] num desktop mostra a mesma página centralizada, não um
// layout diferente.
export function LiveBioSitePreview({ site, onStickerMove }: { site: ToqySite; onStickerMove?: (id: string, x: number, y: number) => void }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] min-w-0 xl:block">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink shadow-sm">
        <span>Preview ao vivo</span>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-xs">
          <button type="button" onClick={() => setMode("mobile")} className={`px-3 py-1.5 font-black transition ${mode === "mobile" ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Mobile</button>
          <button type="button" onClick={() => setMode("desktop")} className={`px-3 py-1.5 font-black transition ${mode === "desktop" ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Desktop</button>
        </div>
      </div>
      {/* Ambas as molduras ficam SEMPRE montadas, só a visibilidade troca
          (2026-09-07, bug real reportado com print: "o preview de mobile
          e desktop estão diferentes"). Antes, o toggle trocava qual JSX
          existia (ternário), então cada clique desmontava o PublicBioSite
          inteiro de uma moldura e montava do zero na outra — o print
          capturou exatamente esse instante de remount, com imagem/estado
          ainda não assentado, aparentando conteúdo diferente entre os
          dois modos. Com `hidden` em vez de desmontar, os dois ficam
          prontos o tempo todo e o toggle vira só troca de exibição — sem
          duplicar áudio/pixels porque instanceId="editor" já mantém
          enableBackgroundMusic/enableTrackingPixels desligados aqui. */}
      <div hidden={mode !== "mobile"} className="h-[calc(100%-4rem)]">
        <PhoneMockup className="mx-auto h-full w-full max-w-[420px]">
          <PublicBioSite site={site} instanceId="editor" onStickerMove={onStickerMove} />
        </PhoneMockup>
      </div>
      <div hidden={mode !== "desktop"} className="h-[calc(100%-4rem)]">
        <BrowserMockup url={`toqy.com.br/b/${site.slug}`} className="mx-auto h-full w-full">
          <PublicBioSite site={site} instanceId="editor" onStickerMove={onStickerMove} />
        </BrowserMockup>
      </div>
    </aside>
  );
}
