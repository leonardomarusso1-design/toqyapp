import Link from "next/link";
import { ReactNode } from "react";
import { Home, Plus, QrCode, Settings, Sparkles, UserRound, Users } from "lucide-react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6faf8] text-slate-950 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="bg-[#11171a] p-4 text-white lg:min-h-screen">
        <div className="flex h-full flex-col">
          <Link href="/" className="flex items-center gap-3 px-2 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#31c4a8] text-lg font-black text-white shadow-sm">T</span>
            <span className="text-xl font-black tracking-tight">TOQY</span>
          </Link>

          <Link href="/app/novo" className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
            <Plus className="h-4 w-4" /> Novo biosite
          </Link>

          <nav className="mt-8 grid gap-2">
            <Nav href="/app" icon={<Home className="h-5 w-5" />} label="Painel" />
            <Nav href="/app" icon={<Sparkles className="h-5 w-5" />} label="Biosites" active />
            <Nav href="/app/qr" icon={<QrCode className="h-5 w-5" />} label="QR Codes" />
            <Nav href="/me" icon={<Users className="h-5 w-5" />} label="Clientes" />
            <Nav href="/app" icon={<Settings className="h-5 w-5" />} label="Configuracoes" />
          </nav>

          <div className="mt-auto hidden border-t border-white/10 pt-5 lg:block">
            <div className="flex items-center gap-3 rounded-2xl px-2 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#103f38] text-sm font-black text-[#8df5df]">L</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">Leonardo Marusso</p>
                <p className="truncate text-xs text-slate-400">leonardomarusso1@gmail.com</p>
              </div>
              <UserRound className="ml-auto h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </aside>

      <section className="min-w-0 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </section>
    </main>
  );
}

function Nav({ href, icon, label, active = false }: { href: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${active ? "bg-white/[0.08] text-[#8df5df]" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}>
      {icon}
      {label}
    </Link>
  );
}
