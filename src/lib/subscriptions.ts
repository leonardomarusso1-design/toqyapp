/**
 * Subscription Plans Configuration
 * FASE 6 — Plans Structure (No Payment Integration)
 * 
 * Defines the available subscription tiers for TOQY.
 * Payment integration will be added in a future phase.
 */

export type PlanType = "free" | "community" | "freelancer" | "agency";

export type Plan = {
  id: PlanType;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number | null;
  features: string[];
  maxSites: number;
  maxTeamMembers: number;
  hasAnalytics: boolean;
  hasWhiteLabel: boolean;
  hasCustomDomain: boolean;
  // Gating real de feature por plano (2026-07-13) — antes disso, essas 3
  // colunas existiam só na tabela comparativa (PLAN_FEATURES_COMPARISON,
  // texto pra exibir na landing) mas NADA no produto de verdade checava
  // isso: catálogo/Pix/Wi-Fi ficavam liberados pra QUALQUER plano,
  // inclusive Gratuito, porque a única coisa que checkBiositeLimit() e o
  // resto do código realmente aplicavam era a quantidade de bio sites.
  // Agora esses 3 campos são a fonte de verdade que PublicBioSite.tsx
  // (renderização pública) e SiteBuilder.tsx (editor) devem consultar.
  hasCatalog: boolean;
  hasPix: boolean;
  hasWifi: boolean;
  // Gera QR Code avulso (Pix/link, sem precisar de bio site) — feature nova
  // de 2026-07-13, mesmo nível que "QR personalizado" já prometia na tabela.
  hasCustomQr: boolean;
  supportLevel: "community" | "email" | "priority";
  highlight?: boolean;
};

export const SUBSCRIPTION_PLANS: Record<PlanType, Plan> = {
  free: {
    id: "free",
    name: "Gratuito",
    description: "Para conhecer a plataforma e gerar seus primeiros leads.",
    priceMonthly: 0,
    priceAnnual: null,
    features: [
      "1 bio site",
      "Domínio toqy.app/seunome",
      "QR Code básico",
      "Preview em tempo real",
      "Marca TOQY na página",
      "Suporte básico",
    ],
    maxSites: 1,
    maxTeamMembers: 1,
    hasAnalytics: false,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    hasCatalog: false,
    hasPix: false,
    hasWifi: false,
    hasCustomQr: false,
    supportLevel: "community",
  },

  // Renomeado de "Comunidade" pra "Essencial" (2026-07-16, pedido do
  // Leonardo) — o acesso à comunidade no Discord virou gratuito/aberto,
  // separado dos planos pagos, então chamar este plano de "Comunidade"
  // não faz mais sentido. O id interno continua "community" de propósito
  // (bate com o valor já gravado em profiles.plan_toqy de quem já assinou,
  // e com o texto "comunidade" que o webhook da Kiwify usa pra reconhecer
  // o produto — ver resolvePlan() em kiwify/webhook/route.ts). Preço e
  // features continuam os mesmos de antes, só a comunicação muda.
  //
  // Motivo de trazer de volta: os planos Freelancer/Agência hoje são
  // pagamento ÚNICO (ver SELLABLE_PLANS + página de preços) — não geram
  // receita recorrente. Este plano é o único mensal de verdade, e é o que
  // sustenta MRR.
  community: {
    id: "community",
    name: "Essencial",
    description: "Para quem cria bio sites para clientes com um custo mensal baixo.",
    priceMonthly: 29.9,
    priceAnnual: 299,
    features: [
      "Até 20 bio sites",
      "Sem taxa por bio site",
      "Catálogo, Pix e Wi-Fi",
      "QR personalizado editável",
      "Gerador de arte com IA",
      "Analytics básico",
      "Suporte por email",
    ],
    maxSites: 20,
    maxTeamMembers: 2,
    hasAnalytics: true,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    hasCatalog: true,
    hasPix: true,
    hasWifi: true,
    hasCustomQr: true,
    supportLevel: "email",
    highlight: true,
  },

  // QR personalizado/editável e gerador de arte com IA REMOVIDOS do
  // Freelancer (2026-07-16, pedido explícito do Leonardo) — decisão de
  // negócio pra diferenciar o plano recorrente (Essencial) e o de topo
  // (Agência) do pagamento único intermediário: quem quer essas duas
  // features precisa ou pagar mensal (Essencial, entrada mais barata) ou
  // ir direto pra Agência — Freelancer vira o "só o essencial de bio
  // site", sem elas. Ver também PLAN_AI_ART_CREDITS em planLimits.ts
  // (freelancer: 0) e a seção de planos da landing (page.tsx), que precisa
  // deixar isso explícito por pedido dele.
  freelancer: {
    id: "freelancer",
    name: "Freelancer",
    description: "Para profissionais que criam para clientes, sem comunidade.",
    priceMonthly: 59.9,
    priceAnnual: 599,
    features: [
      "Até 20 bio sites",
      "Pix e Wi-Fi",
      "Catálogo completo",
      "Analytics avançado",
      "Integração com APIs",
      "Suporte prioritário",
    ],
    maxSites: 20,
    maxTeamMembers: 3,
    hasAnalytics: true,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    hasCatalog: true,
    hasPix: true,
    hasWifi: true,
    hasCustomQr: false,
    supportLevel: "priority",
  },

  agency: {
    id: "agency",
    name: "Agência",
    description: "Para equipes e agências em escala.",
    priceMonthly: 149.9,
    priceAnnual: 1499,
    features: [
      "Até 100 bio sites",
      "QR personalizado editável",
      "Gerador de arte com IA",
      "White label parcial",
      "Domínio próprio",
      "Gestão de equipe completa",
      "Analytics avançado + API",
      "Integrações premium",
      "Suporte 24/7",
      "Recursos customizados",
    ],
    maxSites: 100,
    maxTeamMembers: 10,
    hasAnalytics: true,
    hasWhiteLabel: true,
    hasCustomDomain: true,
    hasCatalog: true,
    hasPix: true,
    hasWifi: true,
    hasCustomQr: true,
    supportLevel: "priority",
  },
};

// De volta ao funil de venda (2026-07-16, pedido do Leonardo) — motivo:
// Freelancer/Agência viraram pagamento único (não geram recorrência), e
// "community" (rebatizado "Essencial" na UI, ver SUBSCRIPTION_PLANS acima)
// é o único plano mensal de verdade, precisa voltar a ser vendável pra
// sustentar MRR. Historia: tinha sido retirado em 2026-07-13 porque a
// comunidade do Discord virou acesso gratuito/aberto — isso continua
// verdade, só que agora o plano é vendido pelas FEATURES (bio sites,
// catálogo, Pix, Wi-Fi, QR), não mais pelo acesso à comunidade.
export const SELLABLE_PLANS: PlanType[] = ["free", "community", "freelancer", "agency"];

// Resolve um valor de plano vindo do banco (profiles.plan_toqy) pra um
// PlanType válido, com fallback seguro pra "free" — protege getPlan() de
// receber string desconhecida (ex: valor legado, typo, plano descontinuado
// que não existe mais em SUBSCRIPTION_PLANS) e quebrar em runtime.
export function resolvePlanTier(rawPlan?: string | null): PlanType {
  const normalized = (rawPlan || "free").toLowerCase();
  return normalized in SUBSCRIPTION_PLANS ? (normalized as PlanType) : "free";
}

export const PLAN_FEATURES_COMPARISON = [
  { feature: "Bio sites", free: "1", community: "20", freelancer: "20", agency: "100" },
  { feature: "QR Code", free: "Básico", community: "Personalizado", freelancer: "Personalizado", agency: "Personalizado" },
  { feature: "Pix & Wi-Fi", free: "Não", community: "Sim", freelancer: "Sim", agency: "Sim" },
  { feature: "Catálogo", free: "Não", community: "Básico", freelancer: "Completo", agency: "Completo" },
  { feature: "Analytics", free: "Não", community: "Básico", freelancer: "Avançado", agency: "Avançado + API" },
  { feature: "White Label", free: "Não", community: "Não", freelancer: "Não", agency: "Sim (parcial)" },
  { feature: "Domínio próprio", free: "Não", community: "Não", freelancer: "Não", agency: "Sim" },
  { feature: "Suporte", free: "Community", community: "Email", freelancer: "Prioritário", agency: "24/7" },
];

/**
 * Utility functions for subscription management
 */

export function getPlan(planType: PlanType): Plan {
  return SUBSCRIPTION_PLANS[planType];
}

export function isPremiumPlan(planType: PlanType): boolean {
  return planType !== "free";
}

export function canCreateSite(planType: PlanType, currentSiteCount: number): boolean {
  const plan = getPlan(planType);
  return currentSiteCount < plan.maxSites;
}

export function formatPrice(price: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(price);
}

export function getAnnualSavings(planType: PlanType): number | null {
  const plan = getPlan(planType);
  if (!plan.priceAnnual) return null;
  const monthlyTotal = plan.priceMonthly * 12;
  return monthlyTotal - plan.priceAnnual;
}
