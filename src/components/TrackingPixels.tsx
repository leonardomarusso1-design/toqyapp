"use client";

import Script from "next/script";
import { useAnalyticsConsent } from "@/lib/cookieConsent";

// Pixels de rastreio POR BIO SITE (2026-09-07, referência Coonexta —
// documento de análise: "Integrações → Pixels & Rastreio"). Diferente
// do GA do próprio Toqy (GoogleAnalytics.tsx, mede o marketing do Toqy)
// — aqui é o CLIENTE FINAL medindo a própria campanha (Meta Ads, Google
// Ads) na página dele.
//
// Consentimento (LGPD, mesma regra já aplicada ao GA do Toqy em
// CookieConsent.tsx): o banner de cookies é global (renderizado em todo
// layout, incluindo /b/[slug]), então o consentimento dado uma vez vale
// pra qualquer script de análise carregado depois neste domínio. Sem
// isso, o pixel do cliente dispararia sem consentimento do visitante.
export function TrackingPixels({ metaPixelId, gaMeasurementId }: { metaPixelId?: string; gaMeasurementId?: string }) {
  const consented = useAnalyticsConsent();
  if (!consented || (!metaPixelId && !gaMeasurementId)) return null;

  return (
    <>
      {metaPixelId ? (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          {/* noscript pro Meta Pixel: navegador com JS desligado (raro,
              mas é o padrão oficial do próprio Meta) continua registrando
              a visita via pixel de imagem 1x1. */}
          <noscript>
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      ) : null}
      {gaMeasurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="biosite-ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
