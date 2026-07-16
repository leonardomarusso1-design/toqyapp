import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export const PLAN_BIOSITE_LIMITS = {
  free: 1,
  community: 10,
  freelancer: 20,
  agency: 100,
} as const;

// Créditos VITALÍCIOS de geração de arte com IA por plano (2026-07-13,
// ajustado 2026-07-16, restaurado no Freelancer na Fase 1 do roadmap
// 2026-07-16 — ver .planning/ROADMAP.md e src/lib/subscriptions.ts). O
// Freelancer virou assinatura mensal e precisava de diferencial real
// frente ao Essencial — ganhou o dobro dos créditos dele (10 vs 5) pra
// justificar o preço mais alto (R$39,90 vs R$29,90). Números iniciais,
// ajustar conforme custo real observado (~R$0,20-0,25 por geração via
// gpt-image-2) — se a demanda for maior que isso, o caminho é vender
// pacotes de créditos extras via Kiwify, não aumentar o limite grátis.
//
// Nota: Essencial e Freelancer agora são recorrentes mensais (não mais
// pagamento único) — "vitalício" neles soa estranho a longo prazo
// (créditos que nunca resetam mesmo pagando todo mês). Reset mensal de
// créditos pra esses planos é uma melhoria futura razoável, não
// implementada agora (exigiria um job recorrente pra zerar
// ai_art_credits_used).
export const PLAN_AI_ART_CREDITS = {
  free: 0,
  community: 5,
  freelancer: 10,
  agency: 50,
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

// Bug real corrigido em 2026-07-13 (Leonardo, plano Agência dando 0/0):
// esta função usava o client anônimo (supabaseClient.ts, chave anon +
// sessão salva no localStorage do NAVEGADOR) — funciona bem quando chamada
// do lado do cliente, mas dentro de uma API route server-side (como
// /api/plaque-designs/generate) esse client não carrega sessão nenhuma,
// então a RLS de "profiles" (auth.uid() = id) filtrava a linha inteira e
// o profile vinha vazio, caindo no fallback "free". Agora aceita um client
// opcional — API routes devem passar getSupabaseAdmin() (service role,
// ignora RLS de propósito), chamadas do lado do cliente continuam
// funcionando sem passar nada (usa o client anônimo de sempre).
export async function checkAiArtCredits(userId: string, client: SupabaseClient = supabase): Promise<AiArtCreditCheckResult> {
  if (!userId) return { allowed: false, used: 0, limit: 0, planTier: "free" };

  const { data: profile } = await client
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
    .select("plan_toqy, plan_tier, biosites_limit, referral_bonus_biosites")
    .eq("id", userId)
    .maybeSingle();

  // plan_toqy é o campo atualizado pelo Kiwify, plan_tier é legado
  const planTier = profile?.plan_toqy || profile?.plan_tier || "free";
  // Bônus do programa de indicação (2026-07-16) — sempre somado por cima
  // do limite do plano, nunca expira, independe de troca de plano.
  const limit = (profile?.biosites_limit || getPlanLimit(planTier)) + (profile?.referral_bonus_biosites ?? 0);

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
