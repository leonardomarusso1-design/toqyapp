import type { Metadata } from "next";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { SentryInit } from "@/components/SentryInit";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "TOQY",
  description: "Bio sites profissionais para QR Code, NFC, Pix e Wi-Fi.",
  icons: {
    icon: "/favicon.png",
    apple: "/brand/favicon-toqy.png",
  },
  openGraph: {
    title: "Toqy",
    description: "Bio sites profissionais para QR Code, NFC e plaquinhas.",
    images: ["/images/landing-hero-toqy.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-body antialiased">
        <SentryInit />
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
