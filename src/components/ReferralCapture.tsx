"use client";

import { useEffect } from "react";
import { captureReferralFromUrl } from "@/lib/referral";

// Componente invisível — só existe pra rodar o efeito de capturar ?ref= da
// URL assim que a landing carrega (page.tsx é Server Component, não pode
// ler window/localStorage direto).
export function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}
