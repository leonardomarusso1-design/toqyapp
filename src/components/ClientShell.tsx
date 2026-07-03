import Link from "next/link";
import { ReactNode } from "react";

export function ClientShell({
  children,
  action,
  fullWidth,
}: {
  children: ReactNode;
  action?: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-7 w-auto object-contain md:h-8" />
            <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-dim sm:inline-flex">Área do cliente</span>
          </Link>
          {action ?? (
            <Link href="/me" className="text-sm font-bold text-muted transition hover:text-accent">
              Minha página
            </Link>
          )}
        </div>
      </header>

      <section className={fullWidth ? "w-full px-3 py-6" : "mx-auto w-full max-w-5xl px-5 py-8 md:py-10"}>{children}</section>
    </main>
  );
}
