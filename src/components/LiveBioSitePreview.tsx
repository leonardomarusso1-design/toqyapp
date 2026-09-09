"use client";

import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ExternalLink, X } from "lucide-react";
import type { ColorValue, ToqySite } from "@/lib/types";
import { buttonHref } from "@/lib/buttonUtils";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";
import { BrowserMockup } from "./BrowserMockup";
import { ColorPicker } from "./ColorPicker";

// Toggle Mobile/Desktop (2026-09-07, referência Coonexta — "PREVIEW AO
// VIVO" com pílulas Mobile/Desktop no canto). O bio site em si continua
// sendo uma página mobile (max-w-[430px] centralizado, ver
// PublicBioSite.tsx) — o que muda é só a MOLDURA ao redor: celular ou
// janela de navegador. É assim que o produto real se comporta: abrir
// /b/[slug] num desktop mostra a mesma página centralizada, não um
// layout diferente.
export function LiveBioSitePreview({
  site,
  onStickerMove,
  selectedButtonId,
  onSelectButton,
  onUpdateButton,
  onRemoveCatalogHighlight,
}: {
  site: ToqySite;
  onStickerMove?: (id: string, x: number, y: number) => void;
  selectedButtonId?: string;
  onSelectButton?: (id: string | undefined) => void;
  onUpdateButton?: (id: string, patch: { color?: ColorValue; textAlign?: "left" | "center" | "right" }) => void;
  onRemoveCatalogHighlight?: (itemId: string) => void;
}) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const selectedButton = selectedButtonId ? site.buttons.find((b) => b.id === selectedButtonId) : undefined;

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] min-w-0 xl:block xl:w-[460px] xl:shrink-0">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink shadow-sm">
        <span>Preview ao vivo</span>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-xs">
          <button type="button" onClick={() => setMode("mobile")} className={`px-3 py-1.5 font-black transition ${mode === "mobile" ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Mobile</button>
          <button type="button" onClick={() => setMode("desktop")} className={`px-3 py-1.5 font-black transition ${mode === "desktop" ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Desktop</button>
        </div>
      </div>
      {/* Painel flutuante de edição rápida (2026-09-09, pedido ao vivo:
          "no próprio preview, clicar nos botões... poder mudar a cor do
          botão, do texto... deixar centralizado ou lado esquerdo ou lado
          direito"). Clicar num botão no preview (ver onSelectButton em
          PublicBioSite.tsx) seleciona em vez de abrir o link — este
          painel edita Cor/Alinhamento daquele botão só, sem arrastar
          livre pela tela (o Leonardo confirmou que é só ajuste dentro do
          que o Toqy já permite, não posição livre tipo Canva de
          verdade). */}
      {selectedButton && onUpdateButton ? (
        <div className="mb-3 rounded-2xl border border-accent/30 bg-accent/5 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-black text-ink">{selectedButton.label || "Botão"}</p>
            {/* "Testar link" (2026-09-09, pedido ao vivo: "clico no botão,
                ele abre pra trocar a cor... mas coloque um botão pra
                poder abrir realmente o botão pra ver a onde ele vai") —
                clicar no botão no preview agora SELECIONA em vez de
                navegar (ver onSelectButton em PublicBioSite.tsx), então
                sem isso não dava mais pra conferir o destino sem sair do
                editor e testar no site publicado de verdade. */}
            {buttonHref(site, selectedButton) ? (
              <a href={buttonHref(site, selectedButton)} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-black text-ink transition hover:border-accent" title="Abrir o link deste botão numa nova aba">
                <ExternalLink className="h-3.5 w-3.5" /> Testar
              </a>
            ) : null}
            <button type="button" onClick={() => onSelectButton?.(undefined)} aria-label="Fechar" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button type="button" onClick={() => onUpdateButton(selectedButton.id, { textAlign: "left" })} className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${(selectedButton.textAlign ?? "center") === "left" ? "border-accent bg-accent/10 text-accent-dim" : "border-border bg-card text-muted hover:border-accent"}`} aria-label="Alinhar à esquerda"><AlignLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => onUpdateButton(selectedButton.id, { textAlign: "center" })} className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${(selectedButton.textAlign ?? "center") === "center" ? "border-accent bg-accent/10 text-accent-dim" : "border-border bg-card text-muted hover:border-accent"}`} aria-label="Centralizar"><AlignCenter className="h-4 w-4" /></button>
            <button type="button" onClick={() => onUpdateButton(selectedButton.id, { textAlign: "right" })} className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${(selectedButton.textAlign ?? "center") === "right" ? "border-accent bg-accent/10 text-accent-dim" : "border-border bg-card text-muted hover:border-accent"}`} aria-label="Alinhar à direita"><AlignRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-2">
            <ColorPicker label="" hint="Vazio = usa a cor global de todos os botões" value={selectedButton.color ?? { mode: "solid", value: "#000000" }} onChange={(v) => onUpdateButton(selectedButton.id, { color: v })} />
          </div>
        </div>
      ) : null}
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
          <PublicBioSite site={site} instanceId="editor" onStickerMove={onStickerMove} selectedButtonId={selectedButtonId} onSelectButton={onSelectButton ? (id) => onSelectButton(id) : undefined} onRemoveCatalogHighlight={onRemoveCatalogHighlight} />
        </PhoneMockup>
      </div>
      <div hidden={mode !== "desktop"} className="h-[calc(100%-4rem)]">
        <BrowserMockup url={`toqy.com.br/b/${site.slug}`} className="mx-auto h-full w-full">
          <PublicBioSite site={site} instanceId="editor" onStickerMove={onStickerMove} selectedButtonId={selectedButtonId} onSelectButton={onSelectButton ? (id) => onSelectButton(id) : undefined} onRemoveCatalogHighlight={onRemoveCatalogHighlight} />
        </BrowserMockup>
      </div>
    </aside>
  );
}
