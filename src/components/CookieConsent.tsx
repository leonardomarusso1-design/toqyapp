"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "./GoogleAnalytics";

const CONSENT_KEY = "toqy-cookie-consent";
type Consent = "accepted" | "rejected";

// Banner de consentimento (2026-09-01) — antes disso o site não pedia
// consentimento de propósito (ver src/app/cookies/page.tsx), porque só
// usava cookies estritamente necessários + diagnóstico interno. Adicionar
// Google Analytics muda isso (cookies de análise não são "necessários"),
// então este banner passa a ser a peça que falta pra manter a mesma
// política honesta: só carrega GA depois de "Aceitar".
export function CookieConsent({ gaMeasurementId }: { gaMeasurementId?: string }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY) as Consent | null;
    setConsent(stored);
    setHydrated(true);
  }, []);

  function choose(value: Consent) {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === "accepted" && gaMeasurementId ? <GoogleAnalytics measurementId={gaMeasurementId} /> : null}

      {hydrated && consent === null ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-5 py-4 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-xs leading-relaxed text-muted md:text-sm">
              Usamos cookies estritamente necessários (login) e, se você aceitar, cookies de análise (Google
              Analytics) pra entender como melhorar o TOQY. Veja nossa{" "}
              <Link href="/cookies" className="font-bold text-accent hover:underline">Política de Cookies</Link>.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => choose("rejected")}
                className="rounded-xl border border-border bg-transparent px-4 py-2 text-xs font-black text-ink transition hover:border-accent/40"
              >
                Recusar
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="rounded-xl bg-accent px-4 py-2 text-xs font-black text-white transition hover:opacity-90"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
