import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-slate-950 font-body antialiased">{children}</body>
    </html>
  );
}
