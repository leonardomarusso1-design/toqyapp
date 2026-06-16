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

function hasConfiguredSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseAnonKey.includes("placeholder"),
  );
}

function getPlanLimit(planTier: string) {
  const normalizedPlanTier = planTier.toLowerCase() as PlanTier;
  return PLAN_BIOSITE_LIMITS[normalizedPlanTier] ?? PLAN_BIOSITE_LIMITS.free;
}

export async function checkBiositeLimit(userId: string): Promise<BiositeLimitCheckResult> {
  if (!userId || !hasConfiguredSupabase()) {
    return {
      allowed: true,
      current: 0,
      limit: Number.POSITIVE_INFINITY,
      planTier: "local",
    };
  }

  const [{ data: profile, error: profileError }, { count, error: countError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan_tier")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("biosites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (countError) {
    throw new Error(countError.message);
  }

  const planTier = profile?.plan_tier ?? "free";
  const limit = getPlanLimit(planTier);
  const current = count ?? 0;

  return {
    allowed: current < limit,
    current,
    limit,
    planTier,
  };
}