// Programa de indicação com comissão — Freelancer e Agência (2026-07-15).
// Substitui o desenho anterior "Agência grátis + revenda 30/70" (ver
// histórico no comentário de SUBSCRIPTION_PLANS.agency em subscriptions.ts)
// — aquele desenho tinha um furo real: qualquer assinante pagante virava
// revendedor de graça sem nunca revender nada. Este é diferente: só quem
// JÁ paga Freelancer ou Agência ganha o link, e a recompensa (comissão,
// desconto pro indicado, bônus de bio site) varia pelo PLANO ATUAL do
// revendedor, recalculado a cada sincronização — não é um status fixo do
// momento em que ele entrou no programa.
//
// Fonte única — qualquer lugar que precise de comissão/desconto/bônus por
// tier deve importar daqui, não duplicar os números.

export type ResellerTier = "freelancer" | "agency";

export type ResellerTierConfig = {
  // Comissão que o revendedor recebe, paga automaticamente pela Kiwify via
  // programa de Afiliados (ver src/lib/kiwifyApi.ts). Kiwify não tem API de
  // criação de afiliado — o revendedor precisa se candidatar 1 vez no link
  // público de afiliados do produto (aprovação automática configurada por
  // Leonardo na Kiwify); nosso sistema só ajusta a comissão pra o valor
  // certo depois disso (POST /api/resellers/sync-affiliate).
  commissionPct: number;
  // Desconto que quem compra através do link do revendedor recebe, em
  // QUALQUER plano pago — aplicado via cupom Kiwify (?coupon=CODIGO na URL
  // de checkout, ver kiwifyCouponCode abaixo).
  buyerDiscountPct: number;
  // Bio sites extras que o revendedor ganha quando um cliente indicado por
  // ele completa o primeiro pagamento — mesmo mecanismo do programa geral
  // de indicação (toqy_referrals, +3 fixo), mas por venda, não só a
  // primeira, e com o valor variando por tier.
  bonusSites: number;
  // Cupom que precisa existir na Kiwify (criado manualmente por Leonardo,
  // uma vez, em cada produto pago) pra este tier funcionar.
  kiwifyCouponCode: string;
};

export const RESELLER_TIERS: Record<ResellerTier, ResellerTierConfig> = {
  freelancer: { commissionPct: 20, buyerDiscountPct: 10, bonusSites: 1, kiwifyCouponCode: "REVENDA10" },
  agency: { commissionPct: 30, buyerDiscountPct: 15, bonusSites: 2, kiwifyCouponCode: "REVENDA15" },
};

// Essencial e Gratuito ficam de fora (decisão explícita — confirmado com
// Leonardo em 2026-07-15): só quem paga Freelancer ou Agência participa.
export function resolveResellerTier(planTier: string | null | undefined): ResellerTier | null {
  if (planTier === "freelancer" || planTier === "agency") return planTier;
  return null;
}

// Monta a URL de checkout com o cupom certo colado — Kiwify aplica o
// desconto automaticamente com ?coupon=CODIGO na URL (confirmado em
// ajuda.kiwify.com.br/pt-br/article/cupons-de-desconto-l808xv, 2026-07-15).
// O cupom em si precisa existir no produto de destino, criado manualmente
// por Leonardo na Kiwify (REVENDA10/REVENDA15, um por produto pago).
export function applyCoupon(checkoutUrl: string, couponCode: string | null): string {
  if (!couponCode) return checkoutUrl;
  const separator = checkoutUrl.includes("?") ? "&" : "?";
  return `${checkoutUrl}${separator}coupon=${encodeURIComponent(couponCode)}`;
}
