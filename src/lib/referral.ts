import type { SupabaseClient } from "@supabase/supabase-js";

// Programa de indicação (2026-07-16) — cada usuário tem um código único
// pra montar o próprio link (toqy.com.br/?ref=CODIGO). Quem se cadastra
// por esse link e DEPOIS paga qualquer plano pela primeira vez dá +3 bio
// sites de bônus pra quem indicou (ver toqy_referrals + kiwify/webhook).

export const REFERRAL_STORAGE_KEY = "toqy_referral_code";

// Código curto, só letras minúsculas + números, sem caracteres ambíguos
// (0/O, 1/l/I removidos) — pensado pra ser digitado/lido sem erro se
// alguém repassar de viva voz.
const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export function generateReferralCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Captura ?ref=CODIGO da URL atual e guarda no localStorage — chamada no
// carregamento da landing e do login, pra sobreviver à navegação entre
// páginas até a pessoa efetivamente criar conta. Nunca sobrescreve um
// código já salvo (primeira indicação vale, evita que a pessoa clique em
// outro link de indicação depois e "roube" o crédito de quem indicou primeiro).
export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (!ref) return;
  if (window.localStorage.getItem(REFERRAL_STORAGE_KEY)) return;
  window.localStorage.setItem(REFERRAL_STORAGE_KEY, ref.trim().toLowerCase());
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearStoredReferralCode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

// Busca o referral_code do usuário, gerando e salvando um novo se ele
// ainda não tiver (lazy — só cria quando alguém de fato abre a tela de
// indicação, não em todo signup).
export async function getOrCreateReferralCode(userId: string, client: SupabaseClient): Promise<string> {
  const { data: existing } = await client.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
  if (existing?.referral_code) return existing.referral_code;

  // Tenta algumas vezes pra driblar colisão rara de unique constraint.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const { error } = await client.from("profiles").update({ referral_code: code }).eq("id", userId);
    if (!error) return code;
  }
  throw new Error("Não foi possível gerar um código de indicação.");
}
