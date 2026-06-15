import Link from "next/link";
import { ReactNode } from "react";

export function ClientShell({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f6faf8] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-emerald-950/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-7 w-auto object-contain md:h-8" />
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#1f9f87] sm:inline-flex">Área do cliente</span>
          </Link>
          {action ?? (
            <Link href="/me" className="text-sm font-black text-slate-600 transition hover:text-[#20b99d]">
              Minha página
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 py-8 md:py-10">{children}</section>
    </main>
  );
}
