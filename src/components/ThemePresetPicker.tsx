"use client";

import type { ThemePreset } from "@/lib/types";
import { themePresets } from "@/lib/themePresets";

export function ThemePresetPicker({ selectedPresetId, onSelect }: { selectedPresetId?: string; onSelect: (preset: ThemePreset) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {themePresets.map((preset) => {
        const selected = preset.id === selectedPresetId;
        return (
          <button key={preset.id} type="button" onClick={() => onSelect(preset)} className={`rounded-3xl border p-4 text-left transition ${selected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-blue-200"}`}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-black text-slate-950">{preset.name}</p><p className="mt-1 text-xs text-slate-500">{preset.description}</p></div>
              <div className="flex gap-1">{[preset.primary, preset.secondary, preset.accent, preset.background].map((color) => <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ background: color }} />)}</div>
            </div>
            <div className="mt-4 rounded-2xl p-3" style={{ background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})` }}>
              <div className="rounded-xl p-3" style={{ background: preset.card, color: preset.text }}><div className="h-2 w-20 rounded-full" style={{ background: preset.primary }} /><div className="mt-2 h-2 w-32 rounded-full opacity-60" style={{ background: preset.text }} /></div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
