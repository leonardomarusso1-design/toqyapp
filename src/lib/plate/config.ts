// Config do módulo Placas na fase de LANÇAMENTO/PRÉ-VENDA (2026-09-10).
//
// Enquanto `PLATE_PREORDER.enabled` for true, a landing e (Fase 2) o
// wizard mostram que é pré-venda: a pessoa paga sabendo que recebe em
// alguns dias. Quando a produção/estoque estabilizar, é só virar pra
// false (some o aviso, fluxo normal). Pode virar config de admin depois.
export const PLATE_PREORDER = {
  enabled: true,
  badge: "Pré-venda de lançamento",
  headline: "Seja um dos primeiros e receba antes de todo mundo",
  detail:
    "Estamos na primeira leva de produção. Você garante sua placa agora, com preço de lançamento, e recebe em alguns dias.",
} as const;

// Link do grupo de WhatsApp de lançamento. Leonardo cria o grupo e cola o
// convite aqui (ou na env NEXT_PUBLIC_PLATE_LAUNCH_WA_GROUP — a env tem
// prioridade, dá pra trocar sem deploy). Vazio = o CTA não aparece.
const HARDCODED_LAUNCH_GROUP = "";

export function plateLaunchWhatsappGroup(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PLATE_LAUNCH_WA_GROUP?.trim();
  return fromEnv || HARDCODED_LAUNCH_GROUP;
}
