import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { PLAN_BIOSITE_LIMITS, PLAN_AI_ART_CREDITS, type PlanTier } from "./planConstants";

// As constantes saíram daqui pra `planConstants.ts` em 2026-09-06 — este
// módulo importa `supabaseClient`, que CRIA o cliente no import, então
// quem só queria o número do limite de um plano acabava subindo um
// cliente Supabase com WebSocket junto (foi o que quebrou o CI em um
// teste de lógica pura, ver comentário completo em planConstants.ts).
//
// A reexportação abaixo existe pra não quebrar os arquivos que já
// importavam essas constantes daqui. Código NOVO que precise só das
// constantes deve importar direto de `./planConstants`, sem passar por
// este módulo.
export { PLAN_BIOSITE_LIMITS, PLAN_AI_ART_CREDITS };
export type { PlanTier };

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
    .select("email, plan_toqy, plan_tier, ai_art_credits_used, overage_ai_art_credits")
    .eq("id", userId)
    .maybeSingle();

  const planTier = profile?.plan_toqy || profile?.plan_tier || "free";
  const used = profile?.ai_art_credits_used ?? 0;

  if (profile?.email && UNLIMITED_AI_ART_EMAILS.includes(profile.email.toLowerCase())) {
    return { allowed: true, used, limit: Infinity, planTier };
  }

  // Top-up avulso (2026-07-17, R$8,99/un via Kiwify) — somado por cima do
  // limite do plano, mesmo padrão vitalício de ai_art_credits_used (nunca
  // reseta). Ver resolveOverageProduct() em webhookLogic.ts.
  const limit = getAiArtCreditLimit(planTier) + (profile?.overage_ai_art_credits ?? 0);
  return { allowed: used < limit, used, limit, planTier };
}

export async function checkBiositeLimit(userId: string): Promise<BiositeLimitCheckResult> {
  if (!userId) {
    return { allowed: false, current: 0, limit: 1, planTier: "free" };
  }

  // Buscar plano do usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_toqy, plan_tier, biosites_limit, referral_bonus_biosites, overage_biosites")
    .eq("id", userId)
    .maybeSingle();

  // plan_toqy é o campo atualizado pelo Kiwify, plan_tier é legado
  const planTier = profile?.plan_toqy || profile?.plan_tier || "free";
  // Bônus do programa de indicação (2026-07-16) + top-up avulso (2026-07-17,
  // R$5,99/un via Kiwify, só Freelancer) — ambos sempre somados por cima do
  // limite do plano, nunca expiram, independem de troca/renovação de plano.
  const limit = (profile?.biosites_limit || getPlanLimit(planTier)) + (profile?.referral_bonus_biosites ?? 0) + (profile?.overage_biosites ?? 0);

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
