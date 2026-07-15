export function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    // style com transform (2026-07-15): qualquer ancestral com transform vira
    // o "containing block" de descendentes position:fixed (CSS spec). Sem
    // isso, um fundo position:fixed dentro do preview escapava desta moldura
    // e passava a se ancorar na janela real do navegador (o painel do editor
    // inteiro), em vez de ficar do tamanho do "celular" simulado aqui — ver
    // PublicBioSite.tsx (backgroundImageUrl/render do fundo).
    <div className={`overflow-hidden rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl ${className}`} style={{ transform: "translateZ(0)" }}>
      <div className="h-full overflow-y-auto bg-ink">{children}</div>
    </div>
  );
}
