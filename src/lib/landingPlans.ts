// Planos como aparecem na landing — copy de marketing (tag/descrição
// pensada pra conversão), não é uma projeção direta de SUBSCRIPTION_PLANS
// (que é a fonte de verdade técnica/gating). Preço e nome vêm de lá
// sempre que possível pra nunca divergir; a copy é escrita à parte porque
// marketing precisa de mais nuance que "lista de features".
//
// Extraído de src/app/page.tsx (2026-09-05, segmentação de público em
// /para-mim e /para-vender) — antes vivia só ali, agora as 2 páginas novas
// importam daqui, sem duplicar a definição.
import { SUBSCRIPTION_PLANS } from "./subscriptions";

export type LandingPlanCard = {
  name: string;
  price: string;
  period: string;
  tag: string;
  description: string;
  highlight: boolean;
  cta: string;
  items: string[];
};

// Público 1 — "Para o meu negócio" (Gratuito + Pro Pessoal). Ver /para-mim.
export const personalPlans: LandingPlanCard[] = [
  {
    name: "Gratuito",
    price: "R$0",
    period: "",
    tag: "Pra testar sem compromisso",
    description: "Seu primeiro bio site no ar em minutos, sem cartão de crédito.",
    highlight: false,
    cta: "Começar grátis",
    items: ["1 bio site", "Domínio toqy.app/seunome", "QR Code básico", "WhatsApp, localização e redes sociais", "Preview em tempo real"],
  },
  {
    name: "Pro",
    price: `R$${SUBSCRIPTION_PLANS.pro.priceMonthly.toFixed(2).replace(".", ",")}`,
    period: "/mês",
    tag: "O bio site completo pro seu negócio",
    description: "Tudo que seu negócio precisa pra vender mais, sem pagar por recursos de agência que você não vai usar.",
    highlight: true,
    cta: "Assinar o Pro",
    items: ["Pix, Wi-Fi e Catálogo", "QR personalizado editável", "Figurinhas e música no bio site", "Analytics básico", "Domínio próprio (add-on avulso)", "Cancele quando quiser"],
  },
];

// Público 2 — "Vender bio sites" (Essencial/Freelancer/Agência). Ver
// /para-vender. Reaproveitado como já existia na landing, sem reabrir
// preço/feature (decisão do Leonardo, 2026-09-05). "Gerador de arte com
// IA" removido de todos os 3 (2026-09-06, pedido do Leonardo — ver nota
// completa em subscriptions.ts).
export const resellerPlans: LandingPlanCard[] = [
  { name: "Essencial", price: "R$29,90", period: "/mês", tag: "Comece a vender bio site pra comércio local", description: "Pra começar a criar bio sites pra clientes, mensal, cancele quando quiser.", highlight: true, cta: "Assinar agora", items: ["Até 10 bio sites", "Sem taxa por bio site", "Catálogo, Pix e Wi-Fi", "★ QR personalizado editável", "Suporte por email", "Cancele quando quiser"] },
  { name: "Freelancer", price: "R$39,90", period: "/mês", tag: "Atenda mais clientes, ganhe indicando", description: "Para quem cria pra clientes com mais frequência — analytics avançado e suporte prioritário. Mensal, cancele quando quiser.", highlight: false, cta: "Assinar agora", items: ["Até 20 bio sites", "Pix e Wi-Fi", "Catálogo completo", "★ QR personalizado editável", "Suporte prioritário", "Cancele quando quiser", "Indique e ganhe 20% de comissão"] },
  { name: "Agência", price: "R$99,90", period: "/mês", tag: "Monte uma operação, gerencie equipe", description: "Para equipes e agências em escala. 100 bio sites, tudo do Freelancer e mais.", highlight: false, cta: "Assinar agora", items: ["Até 100 bio sites", "★ QR personalizado editável", "Domínio próprio", "Gestão de equipe", "Indique e ganhe 30% de comissão"] },
];
