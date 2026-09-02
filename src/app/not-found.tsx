import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada — TOQY",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-16 text-center text-ink">
      <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-8 w-auto object-contain" />
      <p className="mt-10 text-sm font-black uppercase tracking-[0.22em] text-accent">Erro 404</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Essa página não existe</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        O link pode estar errado, ou o bio site/página que você procura não está mais disponível.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="rounded-2xl bg-accent px-6 py-3 text-sm font-black text-white transition hover:opacity-90">
          Voltar ao início
        </Link>
        <Link href="/app/novo" className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-black text-ink transition hover:border-accent/40 hover:text-accent">
          Criar meu bio site
        </Link>
      </div>
    </main>
  );
}
