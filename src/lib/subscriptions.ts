/**
 * Subscription Plans Configuration
 * FASE 6 — Plans Structure (No Payment Integration)
 * 
 * Defines the available subscription tiers for TOQY.
 * Payment integration will be added in a future phase.
 */

export type PlanType = "free" | "community" | "freelancer" | "agency";

// Tipo de cobrança do plano (adicionado na Fase 1 do roadmap, 2026-07-16 —
// ver .planning/ROADMAP.md). Antes disso essa distinção só existia em
// texto solto (comentários, copy da landing, contrato-assinatura/page.tsx),
// duplicada e sem uma única fonte de verdade. "one_time" hoje só se aplica
// à Agência (migra pra revenue-share na Fase 2 do roadmap).
export type BillingType = "recurring" | "one_time";

export type Plan = {
  id: PlanType;
  name: string;
  description: string;
  billingType: BillingType;
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
    billingType: "recurring",
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
    billingType: "recurring",
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

  // Migrado de pagamento único pra assinatura mensal (Fase 1 do roadmap,
  // 2026-07-16 — ver .planning/ROADMAP.md e .planning/PROJECT.md PLAN-01/02).
  // Motivo da mudança de preço/features: como assinatura, o Freelancer
  // (R$59,90 único) tinha MENOS recursos que o Essencial (R$29,90/mês) —
  // tinha perdido QR personalizável e créditos de arte na decisão de
  // 2026-07-16 anterior a esta. Sem diferenciação real, ninguém pagaria
  // mais por ele. Decisão: restaurar QR personalizável + créditos de arte
  // (o dobro do Essencial, ver PLAN_AI_ART_CREDITS em planLimits.ts),
  // preço mensal R$39,90 (acima do Essencial, abaixo de uma conversão
  // ingênua do preço único antigo). Quem já comprou o Freelancer como
  // pagamento único mantém acesso vitalício (ver `legacy_lifetime_access`
  // em profiles — coluna nova, migração em supabase/migrations/) e nunca
  // é cobrado de novo.
  freelancer: {
    id: "freelancer",
    name: "Freelancer",
    description: "Para profissionais que criam para clientes, sem comunidade.",
    billingType: "recurring",
    priceMonthly: 39.9,
    priceAnnual: 399,
    features: [
      "Até 20 bio sites",
      "Pix e Wi-Fi",
      "Catálogo completo",
      "QR personalizado editável",
      "Gerador de arte com IA (10 créditos)",
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
    hasCustomQr: true,
    supportLevel: "priority",
  },

  // Revertido de volta pra pago (2026-07-15, mesmo dia — Leonardo percebeu
  // um furo real no desenho "grátis + revenda": qualquer assinante
  // Essencial/Freelancer pagante clicaria "virar revendedor" e ganharia 100
  // bio sites + todos os recursos de graça, pra sempre, sem nunca precisar
  // revender nada — cancelava a recorrência da Fase 1 sem gerar receita
  // nenhuma em troca. Agência volta a ser assinatura mensal paga (preço
  // calculado como ~67% do antigo pagamento único de R$149,90 — mesma
  // proporção usada quando o Freelancer virou mensal, R$59,90 único →
  // R$39,90/mês). O programa de revenda/comissão NÃO desapareceu — virou
  // um benefício de quem já é Freelancer OU Agência pagante (não mais
  // "torne-se Agência de graça pra revender"), ver src/lib/resellerTiers.ts
  // e .planning/VISION.md seção E.1 (histórico da decisão anterior).
  agency: {
    id: "agency",
    name: "Agência",
    description: "Para equipes e agências em escala.",
    billingType: "recurring",
    priceMonthly: 99.9,
    priceAnnual: 999,
    features: [
      "Até 100 bio sites",
      "QR personalizado editável",
      "Gerador de arte com IA (50 créditos)",
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

// Fonte única dos links de checkout Kiwify (Fase 1 do roadmap, 2026-07-16).
// Antes desta mudança esses links estavam hardcoded, duplicados e
// DIVERGENTES em 5 arquivos (src/app/page.tsx, src/app/app/configuracoes/
// page.tsx, src/app/onboarding/page.tsx, src/app/obrigado/comunidade/
// page.tsx, e o componente órfão SubscriptionPlansDisplay.tsx tinha um
// terceiro conjunto de links diferente pra freelancer/agency). Todo lugar
// que precisar de um link de checkout deve importar daqui.
//
// freelancer: produto recorrente novo ("TOQY Freelancer", R$39,90/mês),
// criado na Kiwify em 2026-07-16 — substitui o link antigo de pagamento
// único (gTIhv6I). Lembrar de desativar o produto antigo na Kiwify pra
// ninguém comprar o modelo de pagamento único por engano.
//
// agency: produto recorrente "TOQY Agência" (R$99,90/mês) criado na Kiwify
// em 2026-07-15, substitui o antigo pagamento único ("xFdnxvE").
export const KIWIFY_LINKS: Record<Exclude<PlanType, "free">, string> = {
  community: "https://pay.kiwify.com.br/12uYE0c",
  freelancer: "https://pay.kiwify.com.br/jSvUXd5",
  agency: "https://pay.kiwify.com.br/DHPZf2c",
};

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
