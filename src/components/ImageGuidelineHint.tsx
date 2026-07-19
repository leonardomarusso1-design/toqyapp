const hints: Record<string, string> = {
  profile: "Recomendado: 512x512 px (quadrado).",
  logo: "Recomendado: 800x800 px PNG transparente.",
  background: "Recomendado: 1080x1920 px para fundo vertical.",
  plaque: "Plaquinha 10x15 cm: 1181x1772 px em 300 DPI.",
  productSquare: "Produto/serviço quadrado: 1080x1080 px.",
  productHorizontal: "Produto/serviço horizontal: 1200x800 px.",
  productVertical: "Produto/serviço vertical: 800x1200 px.",
};
export function ImageGuidelineHint({ type }: { type: keyof typeof hints }) { return <p className="mt-2 text-xs font-bold text-muted">{hints[type]}</p>; }
