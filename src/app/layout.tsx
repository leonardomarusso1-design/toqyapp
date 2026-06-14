import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Toqy - QR Code, NFC e bio sites inteligentes",
  description: "Crie paginas profissionais para QR Code, NFC, WhatsApp, Pix, Wi-Fi, catalogo e links importantes.",
  icons: {
    icon: "/brand/toqy-icon.svg",
    apple: "/brand/toqy-icon.svg",
  },
  openGraph: {
    title: "Toqy",
    description: "Bio sites profissionais para QR Code, NFC e plaquinhas.",
    images: ["/brand/og-image.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 font-sans antialiased">{children}</body>
    </html>
  );
}
