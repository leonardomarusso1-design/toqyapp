import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP sem nonce (abordagem recomendada pelos docs do Next.js pra apps que
// nao precisam de CSP estrita) — mantem geracao estatica das paginas, que
// uma CSP com nonce quebraria (forcaria renderizacao dinamica em tudo).
// 'unsafe-inline' em script-src/style-src fica necessario por causa disso;
// e uma protecao mais fraca contra XSS que a versao com nonce, mas ainda
// cobre clickjacking (frame-ancestors), MIME sniffing e restringe quais
// origens podem ser contatadas via fetch/websocket (connect-src).
//
// worker-src 'self' blob: liberado explicitamente pq o Supabase Realtime
// (pusherTransportTLS no localStorage do visitante) cria workers a partir
// de blob URLs — sem isso o F12 do visitante enchia de erro CSP.
const scriptSrc = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  : "script-src 'self' 'unsafe-inline';";

const cspHeader = `
  default-src 'self';
  ${scriptSrc}
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.de.sentry.io;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  output: 'standalone',
  // Compressão automática
  compress: true,
  // Desabilita o Vercel Speed Insights / Toolbar em produção — esses
  // scripts carregam de vercel.live/_next-live/feedback/feedback.js e
  // violam a CSP (script-src 'self'), enchendo o console do visitante
  // de erros. O Speed Insights já vem como <SpeedInsights /> no layout
  // (controlado por env); o Toolbar só aparece em preview deploys, mas
  // mantemos disableServerVariables e skippSpeedInsights pra garantir.
  devIndicators: false,
  // Otimização de imagens
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
      // Cache longo para assets estáticos
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Cache para imagens públicas (logos, templates)
      {
        source: "/images/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" }],
      },
      {
        source: "/templates/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" }],
      },
      // Cache moderado para páginas de bio site
      {
        source: "/b/(.*)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=120" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "marusso-producoe",
  project: "javascript-nextjs-2t",
  silent: true,
  disableLogger: true,
  sourcemaps: { disable: true },
});
