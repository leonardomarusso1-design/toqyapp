import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP sem nonce (abordagem recomendada pelos docs do Next.js pra apps que
// nao precisam de CSP estrita) — mantem geracao estatica das paginas, que
// uma CSP com nonce quebraria (forcaria renderizacao dinamica em tudo).
// 'unsafe-inline' em script-src/style-src fica necessario por causa disso;
// e uma protecao mais fraca contra XSS que a versao com nonce, mas ainda
// cobre clickjacking (frame-ancestors), MIME sniffing e restringe quais
// origens podem ser contatadas via fetch/websocket (connect-src).
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.de.sentry.io;
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
