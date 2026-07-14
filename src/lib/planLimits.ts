import { supabase } from "./supabaseClient";

export const PLAN_BIOSITE_LIMITS = {
  free: 1,
  community: 20,
  freelancer: 20,
  agency: 100,
} as const;

// Créditos VITALÍCIOS (não mensais) de geração de arte com IA por plano
// (2026-07-13) — os planos pagos do Toqy são pagamento único, não
// assinatura recorrente, então um limite mensal recorrente não faz sentido
// contra uma cobrança que só acontece uma vez. Números iniciais, ajustar
// conforme custo real observado (~R$0,20-0,25 por geração via Gemini 2.5
// Flash Image) — se a demanda for maior que isso, o caminho é vender
// pacotes de créditos extras via Kiwify, não aumentar o limite grátis.
export const PLAN_AI_ART_CREDITS = {
  free: 0,
  community: 5,
  freelancer: 10,
  agency: 30,
} as const;

type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;

export type BiositeLimitCheckResult = {
  allowed: boolean;
  current: number;
  limit: number;
  planTier: string;
};

function getPlanLimit(planTier: string) {
  const normalized = planTier.toLowerCase() as PlanTier;
  return PLAN_BIOSITE_LIMITS[normalized] ?? PLAN_BIOSITE_LIMITS.free;
}

export type AiArtCreditCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  planTier: string;
};

function getAiArtCreditLimit(planTier: string) {
  const normalized = planTier.toLowerCase() as keyof typeof PLAN_AI_ART_CREDITS;
  return PLAN_AI_ART_CREDITS[normalized] ?? PLAN_AI_ART_CREDITS.free;
}

// Bypass de crédito pro dono do Toqy (2026-07-13, pedido do Leonardo) —
// mesmo o plano mais alto (Agência, 30 créditos vitalícios) esgotaria
// rápido só com uso interno de teste. Lista pequena e explícita (não é
// "todo admin", é literalmente o e-mail do dono) — usada tanto aqui
// (checagem real no servidor) quanto na tela /app/artes (pra não mostrar
// "créditos esgotados" pra ele por engano).
export const UNLIMITED_AI_ART_EMAILS = ["leonardomarusso1@gmail.com"];

export async function checkAiArtCredits(userId: string): Promise<AiArtCreditCheckResult> {
  if (!userId) return { allowed: false, used: 0, limit: 0, planTier: "free" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, plan_toqy, plan_tier, ai_art_credits_used")
    .eq("id", userId)
    .maybeSingle();

  const planTier = profile?.plan_toqy || profile?.plan_tier || "free";
  const used = profile?.ai_art_credits_used ?? 0;

  if (profile?.email && UNLIMITED_AI_ART_EMAILS.includes(profile.email.toLowerCase())) {
    return { allowed: true, used, limit: Infinity, planTier };
  }

  const limit = getAiArtCreditLimit(planTier);
  return { allowed: used < limit, used, limit, planTier };
}

export async function checkBiositeLimit(userId: string): Promise<BiositeLimitCheckResult> {
  if (!userId) {
    return { allowed: false, current: 0, limit: 1, planTier: "free" };
  }

  // Buscar plano do usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_toqy, plan_tier, biosites_limit")
    .eq("id", userId)
    .maybeSingle();

  // plan_toqy é o campo atualizado pelo Kiwify, plan_tier é legado
  const planTier = profile?.plan_toqy || profile?.plan_tier || "free";
  const limit = profile?.biosites_limit || getPlanLimit(planTier);

  // Contar bio sites do usuario na tabela correta
  const { count } = await supabase
    .from("toqy_biosites")
    .select("id", { count: "exact", head: true })
    .eq("owner_profile_id", userId);

  const current = count ?? 0;

  return {
    allowed: current < limit,
    current,
    limit,
    planTier,
  };
}
