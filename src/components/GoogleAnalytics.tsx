"use client";

import Script from "next/script";

// Só renderizado depois de consentimento explícito (ver CookieConsent.tsx,
// auditoria 2026-09-01) — GA seta cookies de análise (_ga, _gid), não é
// "estritamente necessário", então precisa de consentimento antes de
// carregar (LGPD/ver src/app/cookies/page.tsx).
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
