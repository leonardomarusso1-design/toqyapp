import type { Metadata } from "next";
import { Unbounded, Manrope } from "next/font/google";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { SentryInit } from "@/components/SentryInit";

// Identidade visual "Signal Ledger" do ecossistema (2026-07-03) — mesma
// dupla de fontes usada no ZapFlow: Unbounded pro display (títulos, CTAs)
// e Manrope pro corpo. next/font/google auto-hospeda os arquivos (sem
// request externo pro Google Fonts em runtime, diferente da tag <link>
// usada no Vite do ZapFlow) e gera as CSS vars usadas em globals.css.
const unbounded = Unbounded({
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
  icons: {
    icon: "/favicon.png",
    apple: "/brand/favicon-toqy.png",
  },
  openGraph: {
    title: "TOQY - Biosites Profissionais",
    description: "Bio sites profissionais para QR Code, NFC e plaquinhas.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "TOQY - Biosites profissionais" }],
  },
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-body antialiased">
        <SentryInit />
        <AuthSync />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
