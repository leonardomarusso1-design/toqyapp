import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Areas privadas/autenticadas — dashboard, edicao com chave de
      // acesso, area do cliente, API e fluxos de auth/onboarding — sem
      // valor de indexacao e nao devem aparecer em busca.
      disallow: ["/app/", "/editar/", "/me", "/api/", "/onboarding", "/auth/", "/portal/", "/qr/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
