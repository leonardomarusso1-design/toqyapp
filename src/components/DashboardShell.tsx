"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Home, Plus, QrCode, Settings, Users } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const navItems = [
  { href: "/app", icon: Home, label: "Painel" },
  { href: "/app/qr", icon: QrCode, label: "QR Codes" },
  { href: "/app/clientes", icon: Users, label: "Clientes" },
  { href: "/app/configuracoes", icon: Settings, label: "Configurações" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-white border-r border-slate-200 flex flex-col p-4 lg:min-h-screen">
        <div className="flex h-full flex-col">
          <Link href="/" className="flex items-center gap-3 px-2 py-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Toqy</span>
          </Link>

          <Link href="/app/novo" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Novo bio site
          </Link>

          <nav className="mt-6 flex-1 space-y-1">
            {navItems.map((item) => {
              const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return <Nav key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} active={active} />;
            })}
            <div className="pt-4 border-t border-slate-100">
              <LogoutButton />
            </div>
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-4">
            <div className="bg-slate-900 rounded-xl p-4 text-white">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Uso dos Sites</p>
              <p className="text-sm">78% Limite Consumido</p>
              <div className="mt-2.5 w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full w-[78%]"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-slate-400">Projetos</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Área Administrativa</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">LM</div>
            <div className="h-4 w-px bg-slate-200 lg:hidden"></div>
            <div className="lg:hidden scale-90">
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="min-w-0 p-4 md:p-8 flex-1">
          <div className="mx-auto max-w-7xl">{children}</div>
        </section>
      </div>
    </main>
  );
}

function Nav({ href, icon, label, active = false }: { href: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
      {icon}
      {label}
    </Link>
  );
}
