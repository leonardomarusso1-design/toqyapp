"use client";

import { useEffect, useState } from "react";

// Extraído de CookieConsent.tsx (2026-09-07) — precisava ser reusado
// pelos pixels de rastreio POR BIO SITE (Meta Pixel/GA do cliente final,
// ver trackingPixels em types.ts). Mesma chave de localStorage: o
// visitante do bio site está no MESMO domínio (toqy.com.br), então o
// consentimento dado uma vez (no banner global, renderizado em TODO
// layout, incluindo /b/[slug]) vale pra qualquer script de análise que
// o Toqy carregar depois, seja o GA do próprio Toqy ou o pixel do
// negócio dono do bio site. Sem isso, os pixels do cliente disparariam
// sem consentimento — mesma falha de LGPD já corrigida uma vez neste
// projeto (ver histórico de CookieConsent.tsx, 2026-09-01).
export const CONSENT_KEY = "toqy-cookie-consent";
export type Consent = "accepted" | "rejected";

export function useAnalyticsConsent(): boolean {
  const [accepted, setAccepted] = useState(false);
  useEffect(() => {
    setAccepted(window.localStorage.getItem(CONSENT_KEY) === "accepted");
  }, []);
  return accepted;
}
