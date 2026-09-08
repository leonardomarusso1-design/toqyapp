"use client";

import { useEffect, useRef, useState } from "react";
import type { ColorValue } from "@/lib/types";

// Extraído de SiteBuilder.tsx (2026-09-07) — precisava ser reusado em
// ButtonEditor.tsx pra cor individual por botão (pedido do Leonardo
// depois de ver o Coonexta: "alterar as cores de cada botão
// individualmente"). Mesmo componente, mesmo comportamento de sempre.

// tudo preto", reportado por cliente. normalizeToHex() resolve QUALQUER
// string de cor CSS válida pro hex equivalente (via canvas), pra alimentar
// o <input> nativo com um valor sempre seguro, sem perder a cor real na
// bolinha de preview (que aceita rgba/qualquer CSS normalmente).
function normalizeToHex(input: string): string {
  const hex6 = /^#[0-9a-fA-F]{6}$/;
  const hex3 = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/;
  if (hex6.test(input)) return input.toLowerCase();
  const m3 = input.match(hex3);
  if (m3) return `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`.toLowerCase();
  if (typeof document === "undefined") return "#000000";
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return "#000000";
    const sentinel = "#123456";
    ctx.fillStyle = sentinel;
    ctx.fillStyle = input;
    // Canvas ignora silenciosamente valores invalidos (mantem o anterior) —
    // se ainda é o sentinel e o input não era literalmente essa cor, foi rejeitado.
    if (ctx.fillStyle === sentinel && input.toLowerCase() !== sentinel) return "#000000";
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#000000";
  }
}

// Um único seletor sólido (swatch + hex) — usado pelo ColorPicker abaixo
// tanto pro modo "Sólida" quanto pros 2 lados (de/para) do "Gradiente".
export function HexSwatchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setLocal(value); }, [value]);

  function handleColorChange(v: string) {
    setLocal(v);
    // Debounce de 80ms para não re-renderizar o bio site a cada pixel do picker
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 80);
  }

  const safeHex = normalizeToHex(local);
  return (
    <div className="flex items-center gap-2">
      <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center">
        <span className="h-9 w-9 rounded-full border-2 border-[#ffffff] shadow-md ring-1 ring-border transition hover:scale-110" style={{ background: local }} />
        <input type="color" value={safeHex}
          onChange={(e) => handleColorChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <input type="text" value={local}
        onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) handleColorChange(e.target.value); }}
        className="w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 font-mono text-xs text-ink outline-none focus:border-accent"
        maxLength={7} />
    </div>
  );
}

// Reforma completa (2026-09-06) — antes era só sólido; agora cada role
// aceita sólido OU gradiente (ColorValue, ver types.ts/colorRoles.ts).
// Reaproveita HexSwatchInput acima pros 2 lados do gradiente.
export function ColorPicker({ label, hint, value, onChange }: { label: string; hint: string; value: ColorValue; onChange: (v: ColorValue) => void }) {
  const isGradient = value.mode === "gradient";
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      {/* flex-wrap (2026-09-08, bug real com print: linha sem quebra +
          shrink-0 no toggle Sólida/Gradiente — quando o label+hint são
          longos, o toggle não encolhia e saía da tela pra direita, num
          celular real. Usado em ~19 cores da Aparência + "Cor deste
          botão" do ButtonEditor, então cortava a tela inteira nos dois
          lugares de uma vez). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">{label}</p>
          <p className="truncate text-xs text-muted">{hint}</p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-[10px] font-black">
          <button type="button" onClick={() => !isGradient || onChange({ mode: "solid", value: value.from })} className={`px-2.5 py-1.5 transition ${!isGradient ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Sólida</button>
          <button type="button" onClick={() => isGradient || onChange({ mode: "gradient", from: value.value, to: value.value })} className={`px-2.5 py-1.5 transition ${isGradient ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Gradiente</button>
        </div>
      </div>
      <div className="mt-2">
        {isGradient ? (
          <div className="grid grid-cols-2 gap-2">
            <HexSwatchInput value={value.from} onChange={(v) => onChange({ mode: "gradient", from: v, to: value.to })} />
            <HexSwatchInput value={value.to} onChange={(v) => onChange({ mode: "gradient", from: value.from, to: v })} />
          </div>
        ) : (
          <HexSwatchInput value={value.value} onChange={(v) => onChange({ mode: "solid", value: v })} />
        )}
      </div>
    </div>
  );
}
