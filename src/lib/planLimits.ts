import { supabase } from "./supabaseClient";

export const PLAN_BIOSITE_LIMITS = {
  free: 1,
  community: 20,
  freelancer: 20,
  agency: 100,
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
