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
    supportLevel: "community",
  },

  community: {
    id: "community",
    name: "Comunidade",
    description: "Para quem está na comunidade e cria páginas para clientes.",
    priceMonthly: 29.9,
    priceAnnual: 299,
    features: [
      "Até 20 bio sites",
      "Sem taxa por bio site",
      "Catálogo, Pix e Wi-Fi",
      "QR personalizado",
      "Acesso à comunidade TOQY",
      "Analytics básico",
      "Suporte por email",
    ],
    maxSites: 20,
    maxTeamMembers: 2,
    hasAnalytics: true,
    hasWhiteLabel: false,
    hasCustomDomain: false,
    supportLevel: "email",
    highlight: true,
  },

  freelancer: {
    id: "freelancer",
    name: "Freelancer",
    description: "Para profissionais que criam para clientes, sem comunidade.",
    priceMonthly: 59.9,
    priceAnnual: 599,
    features: [
      "Até 20 bio sites",
      "QR personalizado",
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
    supportLevel: "priority",
  },
};

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
