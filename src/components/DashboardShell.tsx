"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BarChart3, Home, Menu, Plus, QrCode, Settings, Sparkles, Users, X } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/app", icon: Home, label: "Painel" },
  { href: "/onboarding", icon: Users, label: "Novo cliente" },
  { href: "/app/qr", icon: QrCode, label: "QR Codes" },
  { href: "/app/artes", icon: Sparkles, label: "Artes com IA" },
  { href: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/app/configuracoes", icon: Settings, label: "Configurações" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [atLimit, setAtLimit] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fecha o drawer mobile automaticamente ao navegar para outra rota
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

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
    <main className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-[260px_1fr]">
      {/* Fundo escuro atrás do menu, só em telas pequenas — clicar fora fecha */}
      {sidebarOpen ? <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <aside className={`fixed top-0 left-0 z-50 h-screen w-[260px] bg-card border-r border-border flex flex-col p-4 transition-transform duration-200 lg:static lg:h-auto lg:min-h-screen lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-2 py-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold tracking-tight text-ink">Toqy</span>
            </Link>
            <button type="button" onClick={() => setSidebarOpen(false)} className="text-muted hover:text-ink lg:hidden" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          {atLimit ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-xs font-black text-red-600">Limite atingido</p>
              <p className="mt-0.5 text-xs text-muted">Faça upgrade para criar mais bio sites.</p>
              <Link href="/#planos" className="mt-2 inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700">
                Fazer upgrade
              </Link>
            </div>
          ) : (
            <Link href="/app/novo" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-dim">
              <Plus className="h-4 w-4" /> Novo bio site
            </Link>
          )}

          <nav className="mt-6 flex-1 space-y-1">
            {navItems.map((item) => {
              const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return <Nav key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} active={active} />;
            })}
            <div className="pt-4 border-t border-border">
              <LogoutButton />
            </div>
          </nav>

          <div className="mt-auto border-t border-border pt-4">
            <div className="rounded-xl bg-surface p-4 text-center">
              <p className="text-xs font-bold text-muted">TOQY</p>
              <p className="mt-1 text-xs text-muted">Bio sites profissionais</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center gap-3 text-sm font-medium">
            <button type="button" onClick={() => setSidebarOpen(true)} className="text-ink p-1 -ml-1 lg:hidden" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-ink font-semibold">Meu painel</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Avatar do usuário */}
            <Link href="/app/configuracoes" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-surface transition hover:border-accent">
              {userAvatar ? (
                <img src={userAvatar} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black text-muted">{userInitial}</span>
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
    <Link href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-accent/10 text-accent-dim" : "text-muted hover:bg-surface hover:text-ink"}`}>
      {icon}
      {label}
    </Link>
  );
}
