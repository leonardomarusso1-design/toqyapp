export function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    // style com transform (2026-07-15): qualquer ancestral com transform vira
    // o "containing block" de descendentes position:fixed (CSS spec). Sem
    // isso, um fundo position:fixed dentro do preview escapava desta moldura
    // e passava a se ancorar na janela real do navegador (o painel do editor
    // inteiro), em vez de ficar do tamanho do "celular" simulado aqui — ver
    // PublicBioSite.tsx (backgroundImageUrl/render do fundo).
    //
    // bug real corrigido (2026-07-15), efeito colateral do transform acima:
    // transform também torna este wrapper a raiz de um contexto de
    // empilhamento LOCAL — e dentro dele, um filho estático com fundo opaco
    // (esta div interna tinha bg-ink) pinta NA FRENTE de qualquer descendente
    // com z-index negativo (a camada de fundo -z-10 do PublicBioSite), pelas
    // regras de stacking do CSS. Resultado: preview inteiro ficava preto,
    // cobrindo a imagem de fundo. O bg-ink do wrapper EXTERNO continua seguro
    // (é o "próprio fundo da raiz do contexto", sempre pintado por baixo de
    // tudo) — só a div interna não pode ter fundo opaco.
    <div className={`overflow-hidden rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl ${className}`} style={{ transform: "translateZ(0)" }}>
      <div className="h-full overflow-y-auto">{children}</div>
    </div>
  );
}
