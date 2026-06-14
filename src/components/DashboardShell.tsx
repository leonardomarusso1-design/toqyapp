import Link from "next/link";
import { ReactNode } from "react";
import { Home, QrCode, Settings, Sparkles, UserRound } from "lucide-react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-white/10 bg-slate-900/80 p-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <Link href="/" className="flex items-center gap-3"><img src="/brand/toqy-logo.svg" alt="TOQY" className="h-9 w-auto" /></Link>
        <nav className="mt-8 grid gap-2">
          <Nav href="/app" icon={<Home className="h-4 w-4" />} label="Painel" />
          <Nav href="/app/novo" icon={<Sparkles className="h-4 w-4" />} label="Criar bio site" />
          <Nav href="/app/qr" icon={<QrCode className="h-4 w-4" />} label="QR Codes" />
          <Nav href="/me" icon={<UserRound className="h-4 w-4" />} label="Área do cliente" />
          <Nav href="/app" icon={<Settings className="h-4 w-4" />} label="Configurações" />
        </nav>
        <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100"><b>Modo MVP</b><br />Dados salvos no navegador com localStorage. Preparado para Supabase depois.</div>
      </aside>
      <section className="min-w-0 p-5 md:p-8">{children}</section>
    </main>
  );
}
function Nav({ href, icon, label }: { href: string; icon: ReactNode; label: string }) { return <Link href={href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white">{icon}{label}</Link>; }
