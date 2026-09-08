import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { CookieConsent } from "@/components/CookieConsent";

// Fonte de display trocada de Unbounded pra Bricolage Grotesque
// (2026-09-07, pedido do Leonardo: "quero padronizar meus SaaS... todos
// com a mesma fonte" — usando o Patrimo como referência de sistema). O
// corpo já era Manrope nos dois, então essa era a única peça fora do
// padrão. Nome da CSS var (--font-display) mantido de propósito — é
// referenciado em globals.css e não muda em runtime, só o arquivo de
// fonte por trás dela.
const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "TOQY - Biosites Profissionais",
  description: "Bio sites profissionais para QR Code, NFC, Pix e Wi-Fi.",
  keywords: ["bio site", "link na bio", "QR Code", "NFC", "Pix", "cartão digital", "cardápio digital"],
  icons: {
    // SVG primeiro (2026-09-08, pacote visual novo — favicon.svg):
    // navegador moderno usa o SVG (nítido em qualquer tamanho/tema);
    // favicon.png (gerado do mesmo SVG via sharp) é o fallback pra quem
    // não suporta. apple-touch-icon precisa ser raster mesmo (iOS não
    // aceita SVG aqui), também gerado do favicon.svg, 180x180.
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/brand/favicon-toqy.png",
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "TOQY",
    title: "TOQY - Biosites Profissionais",
    description: "Bio sites profissionais para QR Code, NFC e plaquinhas.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "TOQY - Biosites profissionais" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOQY - Biosites Profissionais",
    description: "Bio sites profissionais para QR Code, NFC e plaquinhas.",
    images: ["/images/og-image.png"],
  },
};

// SpeedInsights (@vercel/speed-insights) desativado em 2026-07-18 — o
// componente <SpeedInsights /> injeta scripts de
// vercel.live/_next-live/feedback/feedback.js que violam a CSP
// (script-src 'self') e poluem o console do visitante com erros. Pra
// reativar, reinstale o uso: import + <SpeedInsights /> no body abaixo.

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${displayFont.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-body antialiased">
        <AuthSync />
        {children}
        <CookieConsent gaMeasurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
