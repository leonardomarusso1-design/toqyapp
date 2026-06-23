"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Home, Plus, QrCode, Settings, Users } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/app", icon: Home, label: "Painel" },
  { href: "/onboarding", icon: QrCode, label: "Novo cliente" },
  { href: "/app/configuracoes", icon: Settings, label: "Configurações" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [atLimit, setAtLimit] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    async function checkLimit() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Foto e inicial do usuário
      const meta = session.user.user_metadata;
      setUserAvatar(meta?.avatar_url || meta?.picture || null);
      setUserInitial((meta?.full_name || meta?.name || session.user.email || "U").charAt(0).toUpperCase());

      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("biosites_limit").eq("id", session.user.id).maybeSingle(),
        supabase.from("toqy_biosites").select("id", { count: "exact", head: true }).eq("owner_profile_id", session.user.id),
      ]);

      const limit = profile?.biosites_limit ?? 1;
      setAtLimit((count ?? 0) >= limit);
    }
    checkLimit();
  }, [pathname]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-white border-r border-slate-200 flex flex-col p-4 lg:min-h-screen">
        <div className="flex h-full flex-col">
          <Link href="/" className="flex items-center gap-3 px-2 py-4">
            <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold tracking-tight text-slate-800">Toqy</span>
          </Link>

          {atLimit ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-xs font-black text-red-600">Limite atingido</p>
              <p className="mt-0.5 text-xs text-slate-500">Faça upgrade para criar mais bio sites.</p>
              <Link href="/#planos" className="mt-2 inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700">
                Fazer upgrade
              </Link>
            </div>
          ) : (
            <Link href="/app/novo" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#31c4a8] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#25b69a]">
              <Plus className="h-4 w-4" /> Novo bio site
            </Link>
          )}

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
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-bold text-slate-400">TOQY</p>
              <p className="mt-1 text-xs text-slate-400">Bio sites profissionais</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-slate-900 font-semibold">Meu painel</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Avatar do usuário */}
            <Link href="/app/configuracoes" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 transition hover:border-[#31c4a8]">
              {userAvatar ? (
                <img src={userAvatar} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black text-slate-600">{userInitial}</span>
              )}
            </Link>
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
