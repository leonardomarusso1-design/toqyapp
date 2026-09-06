import { getStickerDef } from "@/lib/stickerLibrary";

// Formas soltas do banco de figurinhas (ver stickerLibrary.ts) — SVG
// próprio, desenhado simples de propósito (sem asset externo, sem risco
// de direito autoral). currentColor por padrão pra herdar a cor do tema,
// mas cada forma já vem com uma cor de destaque fixa (mais "figurinha",
// menos "ícone do sistema").
function ShapeSvg({ shapeKey, className }: { shapeKey: string; className?: string }) {
  switch (shapeKey) {
    case "shape-burst":
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none">
          <g stroke="#FF3B6B" strokeWidth="8" strokeLinecap="round">
            <path d="M50 8v20M50 72v20M92 50H72M28 50H8M79 21 65 35M35 65 21 79M79 79 65 65M35 35 21 21" />
          </g>
        </svg>
      );
    case "shape-scribble":
      return (
        <svg className={className} viewBox="0 0 100 60" fill="none">
          <path d="M4 30c8-24 16-24 24 0s16 24 24 0 16-24 24 0 16 24 20 12" stroke="#6366F1" strokeWidth="7" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "shape-ring":
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="34" stroke="#FFB100" strokeWidth="10" />
        </svg>
      );
    case "shape-blob":
      return (
        <svg className={className} viewBox="0 0 100 100">
          <path fill="#34D399" d="M32 10c20-8 44-4 54 14s6 40-10 54-42 18-56 2S8 44 14 28s0-10 18-18z" />
        </svg>
      );
    case "shape-arrow-curve":
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none">
          <path d="M12 70c30 18 58 10 70-24" stroke="#0EA5E9" strokeWidth="8" strokeLinecap="round" />
          <path d="M68 32l16-2 4 16" stroke="#0EA5E9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shape-dots":
      return (
        <svg className={className} viewBox="0 0 100 40" fill="#FF3B6B">
          <circle cx="12" cy="20" r="10" />
          <circle cx="50" cy="20" r="10" />
          <circle cx="88" cy="20" r="10" />
        </svg>
      );
    default:
      return null;
  }
}

export function StickerIcon({ stickerKey, className }: { stickerKey: string; className?: string }) {
  const def = getStickerDef(stickerKey);
  if (!def) return null;
  if (def.kind === "emoji") {
    return <span className={className} style={{ lineHeight: 1 }}>{def.emoji}</span>;
  }
  return <ShapeSvg shapeKey={def.key} className={className} />;
}
