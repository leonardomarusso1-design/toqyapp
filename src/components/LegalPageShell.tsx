import Link from "next/link";
import { ReactNode } from "react";
import { APP_VERSION, BUILD_ID } from "@/lib/appInfo";

const legalLinks = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contrato-assinatura", label: "Contrato de Assinatura" },
];

export function LegalPageShell({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/logo-toqy-horizontal-dark.png" alt="TOQY" className="h-7 w-auto object-contain md:h-8" />
          </Link>
          <Link href="/" className="text-sm font-bold text-muted transition hover:text-accent">Voltar ao início</Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl px-5 py-10 md:py-14">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{title}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Última atualização: {updatedAt}</p>

        <div className="legal-content mt-8 space-y-5 text-sm leading-relaxed text-ink [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-black [&_h3]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:font-bold [&_a]:text-accent [&_a:hover]:text-accent-dim [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:p-2">
          {children}
        </div>
      </article>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-8 text-xs text-muted">
          <p className="font-bold text-ink">TOQY</p>
          <p className="mt-1">Um produto de Marusso Produções · Leonardo Marusso · CPF 473.503.798-54 · Indaiatuba - SP</p>
          <p className="mt-1">leonardomarusso1@gmail.com · (19) 99705-1919</p>
          <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
            {legalLinks.map((link, i) => (
              <span key={link.href}>
                <Link href={link.href} className="hover:text-accent">{link.label}</Link>
                {i < legalLinks.length - 1 ? " ·" : ""}
              </span>
            ))}
          </p>
          <p className="mt-3">
            © {new Date().getFullYear()} Marusso Produções. Todos os direitos reservados. · v{APP_VERSION} · build {BUILD_ID}
          </p>
        </div>
      </footer>
    </main>
  );
}
