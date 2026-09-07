export function BrowserMockup({ children, className = "", url }: { children: React.ReactNode; className?: string; url?: string }) {
  return (
    // Mesmo fix de stacking context de PhoneMockup.tsx (transform:
    // translateZ(0) — containing block pra position:fixed do fundo do
    // bio site, ver comentário grande lá). Moldura de navegador em vez
    // de celular pro toggle "Desktop" do preview (2026-09-07, referência
    // Coonexta) — o CONTEÚDO em si continua o mesmo bio site mobile
    // (max-w-[430px] centralizado), só a moldura ao redor muda. Um bio
    // site é uma página feita pra celular; abrir no desktop mostra a
    // mesma coisa centralizada num fundo maior, não um layout diferente
    // — é assim que o produto real se comporta hoje.
    <div className={`overflow-hidden rounded-2xl border-[6px] border-ink bg-ink shadow-2xl ${className}`} style={{ transform: "translateZ(0)" }}>
      <div className="flex h-8 shrink-0 items-center gap-1.5 bg-ink px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        {url ? <span className="ml-3 truncate rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">{url}</span> : null}
      </div>
      <div className="h-[calc(100%-2rem)] overflow-y-auto bg-surface">{children}</div>
    </div>
  );
}
