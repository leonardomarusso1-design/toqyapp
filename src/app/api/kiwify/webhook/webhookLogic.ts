// Lógica pura (sem I/O) extraída de route.ts na Fase 1 do roadmap
// (2026-07-16 — ver .planning/ROADMAP.md) para ser testável sem precisar
// simular um Request/Supabase inteiro. route.ts importa e usa estas
// funções; os testes em webhookLogic.test.ts cobrem só isto.

import { PLAN_BIOSITE_LIMITS } from "@/lib/planConstants";

// Bug real corrigido (2026-07-16, achado investigando um scenario do Make):
// o limite do plano "comunidade" (Essencial) estava HARDCODED em 20 aqui,
// duplicado e divergente da fonte única de verdade (PLAN_BIOSITE_LIMITS em
// planLimits.ts, que diz 10 pra community) — toda compra real do Essencial
// via Kiwify gravava biosites_limit=20, o dobro do prometido. Confirmado
// no banco: contas "community" tinham 10 OU 20 inconsistentemente,
// dependendo de quando assinaram. Agora lê do mesmo lugar que o resto do
// sistema usa (PLAN_BIOSITE_LIMITS), nunca mais duplica o número.
export function resolvePlan(productName: string): { plan: string; limit: number } | null {
  const n = productName.toLowerCase();
  // "TOQY Pro" (R$9,90) — ORDEM IMPORTA: checar ANTES de "community",
  // "freelancer", etc. por que "pro" é substring menor. O regex precisa
  // ser mais flexível que o original (2026-09-06) porque na Kiwify real
  // o nome do produto pode ser "Plano Pro", "Toqy - Pro Pessoal",
  // "TOQY Pro R$9,90", etc. Sem exagerar na liberdade: exigimos que a
  // palavra "pro" exista como palavra INTEIRA E que "toqy" também exista
  // em algum lugar, ou alternativamente "plano pro" / "pro pessoal".
  // Desta forma "TOQY Promoção de Natal" continua não casando (não tem
  // "pro" como palavra inteira — tem "promoção").
  const hasToqy = n.includes("toqy");
  const hasProWord = /(^|[^a-z])pro([^a-z]|$)/.test(n);
  const hasPessoal = n.includes("pessoal");
  const hasR990 = n.includes("9,90") || n.includes("9.90") || n.includes("r$9");
  if ((hasToqy && hasProWord) || (hasProWord && (hasPessoal || hasR990))) {
    return { plan: "pro", limit: PLAN_BIOSITE_LIMITS.pro };
  }
  if (n.includes("comunidade")) return { plan: "community", limit: PLAN_BIOSITE_LIMITS.community };
  if (n.includes("freelancer")) return { plan: "freelancer", limit: PLAN_BIOSITE_LIMITS.freelancer };
  if (n.includes("agencia") || n.includes("agência")) return { plan: "agency", limit: PLAN_BIOSITE_LIMITS.agency };
  return null;
}

export type OverageType = "biosite" | "ai_art_credit" | "custom_domain_addon";

// Produtos de top-up avulso (2026-07-17, cobrança de excedente — ver
// .planning/ROADMAP.md Phase 2 "Pendente") — não são planos, não passam por
// resolvePlan(). Nomes propostos ("TOQY - Bio Site Extra" / "TOQY - Crédito
// de Arte Extra") evitam de propósito as substrings que resolvePlan() já usa
// ("freelancer", "comunidade", "agencia"/"agência") pra nunca colidir e virar
// upgrade de plano por engano — ver route.ts, este check roda ANTES de
// resolvePlan().
export function resolveOverageProduct(productName: string): OverageType | null {
  const n = productName.toLowerCase();
  if (n.includes("bio site") && n.includes("extra")) return "biosite";
  if (n.includes("extra") && (n.includes("arte") || n.includes("credito") || n.includes("crédito"))) return "ai_art_credit";
  // Domínio próprio avulso (2026-09-05, add-on anual do Pro Pessoal) — nome
  // proposto "TOQY - Domínio Próprio", evita de propósito "extra" (não é
  // "excedente" de algo que já existe, é uma feature nova on/off) pra não
  // colidir com os outros 2 overages acima.
  if (n.includes("dominio") || n.includes("domínio")) return "custom_domain_addon";
  return null;
}

export type ProfileForDowngradeCheck = {
  legacy_lifetime_access?: boolean | null;
} | null | undefined;

// Decide se um perfil deve ser rebaixado pra "free" ao receber um evento
// de cancelamento/reembolso da Kiwify.
//
// Fase 1 do roadmap (2026-07-16): antes desta função existir, QUALQUER
// evento de cancelamento/reembolso rebaixava o perfil incondicionalmente
// — isso rebaixaria por engano um comprador legado de pagamento único
// (Freelancer ou Agência, comprados antes da migração pra recorrência)
// se algum evento de cancelamento chegasse associado ao e-mail dele
// (ex: erro humano na Kiwify, teste indevido, e-mail duplicado).
//
// Regra: nunca rebaixar quem tem `legacy_lifetime_access === true` —
// esse flag é setado uma única vez, na migração (ver
// supabase/migrations/), pra quem já tinha pago o modelo antigo de
// pagamento único antes desta fase existir. Perfil não encontrado (null)
// não tem nada a proteger, mantém o comportamento padrão (rebaixar).
export function shouldDowngradeOnCancel(profile: ProfileForDowngradeCheck): boolean {
  if (!profile) return true;
  return profile.legacy_lifetime_access !== true;
}

// Fase 2 do roadmap (2026-07-16 — Revenue Share/Agência): decide se uma
// venda atribuída a um cliente gerenciado bate com o afiliado esperado
// (o revendedor que gerencia aquele cliente) antes de gravar no ledger de
// comissão como "matched".
//
// Isso NÃO é uma trava técnica — a Kiwify paga comissão automaticamente pra
// qualquer venda feita pelo link do afiliado, independente de o comprador
// ser ou não um cliente cadastrado como gerenciado no Toqy. O que esta
// função decide é só o STATUS de auditoria gravado no ledger:
// - "matched": o afiliado da venda é o mesmo revendedor que gerencia esse
//   cliente — o caso esperado.
// - "affiliate_mismatch": a venda tem um afiliado, mas diferente do
//   revendedor esperado (ou o revendedor ainda não tem kiwify_affiliate_id
//   cadastrado) — fica visível pra reconciliação manual periódica, não
//   bloqueia nada (ver .claude/jarvis/PENDING.md no repo do Mega Brain).
export function resolveAttributionStatus(
  resellerAffiliateId: string | null | undefined,
  saleAffiliateId: string | null | undefined
): "matched" | "affiliate_mismatch" {
  if (!resellerAffiliateId || !saleAffiliateId) return "affiliate_mismatch";
  return resellerAffiliateId === saleAffiliateId ? "matched" : "affiliate_mismatch";
}
