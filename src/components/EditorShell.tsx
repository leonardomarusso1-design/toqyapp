"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

// Moldura mínima pra tela de criação/edição de UM bio site (2026-09-07,
// bug real reportado ao vivo com print: "olha como fica espremido, devia
// sair aquele painel esquerdo, e ficar apenas o da edição do bio site,
// igual é os do print que te mandei do concorrente"). Antes, /app/novo
// usava <DashboardShell> — a sidebar INTEIRA do painel (Painel, Novo
// cliente, QR Codes, Analytics...) ficava ao lado da sidebar PRÓPRIA do
// SiteBuilder (Aparência, Botões, Pix...), espremendo o miolo do editor
// entre duas colunas de navegação ao mesmo tempo. No Coonexta (e agora
// aqui), entrar pra editar UM site troca a sidebar do painel por só uma
// barra fina no topo — o editor usa a tela inteira.
export function EditorShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/app" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Voltar pros meus sites
          </Link>
          <Link href="/app" className="flex items-center gap-2">
            <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-7 w-7 rounded-lg" />
          </Link>
        </div>
      </header>
      <section className="w-full px-3 py-6">{children}</section>
    </main>
  );
}
