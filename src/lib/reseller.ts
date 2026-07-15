// Revenue Share — Agência (Fase 2 do roadmap, 2026-07-15). Espelha
// src/lib/referral.ts (mesma captura de código via URL, mesmo alfabeto),
// com uma diferença importante: toqy_resellers NÃO tem policy de
// INSERT/UPDATE client-side (ver supabase/migrations/
// 2026-07-16_agency_revenue_share.sql) — geração/gravação do reseller_code
// só pode acontecer server-side (service role), por isso não existe aqui
// um getOrCreateResellerCode() equivalente ao getOrCreateReferralCode() de
// referral.ts. Essa parte fica em POST /api/resellers/join.

export const RESELLER_STORAGE_KEY = "toqy_revenda_code";

// Mesmo alfabeto de referral.ts — só letras minúsculas + números, sem
// caracteres ambíguos (0/O, 1/l/I removidos).
const CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export function generateResellerCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Captura ?revenda=CODIGO da URL atual e guarda no localStorage — mesma
// semântica de captureReferralFromUrl(): nunca sobrescreve um código já
// salvo (primeiro link clicado vale).
export function captureRevendaFromUrl() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("revenda");
  if (!code) return;
  if (window.localStorage.getItem(RESELLER_STORAGE_KEY)) return;
  window.localStorage.setItem(RESELLER_STORAGE_KEY, code.trim().toLowerCase());
}

export function getStoredRevendaCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(RESELLER_STORAGE_KEY);
}

export function clearStoredRevendaCode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RESELLER_STORAGE_KEY);
}
