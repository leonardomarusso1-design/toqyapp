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
  // instanceId obrigatorio aqui (2026-09-06): sem ele, o PublicBioSite
  // conta um page_view a cada vez que o preview monta — ou seja, o
  // proprio dono editando inflava as visitas do bio site dele. So a
  // pagina publica de verdade (sem instanceId) deve contar.
  const content = <PublicBioSite site={site} instanceId="editor" onStickerMove={onStickerMove} />;

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] min-w-0 xl:block">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink shadow-sm">
        <span>Preview ao vivo</span>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-xs">
          <button type="button" onClick={() => setMode("mobile")} className={`px-3 py-1.5 font-black transition ${mode === "mobile" ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Mobile</button>
          <button type="button" onClick={() => setMode("desktop")} className={`px-3 py-1.5 font-black transition ${mode === "desktop" ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Desktop</button>
        </div>
      </div>
      {mode === "mobile" ? (
        <PhoneMockup className="mx-auto h-[calc(100%-4rem)] w-full max-w-[420px]">{content}</PhoneMockup>
      ) : (
        <BrowserMockup url={`toqy.com.br/b/${site.slug}`} className="mx-auto h-[calc(100%-4rem)] w-full">{content}</BrowserMockup>
      )}
    </aside>
  );
}
