"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { BarChart3, Crown, Globe, Handshake, Headset, Home, MoreHorizontal, Plus, QrCode, Settings, Users } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { SupportChatWidget } from "@/components/SupportChatWidget";
import { supabase } from "@/lib/supabaseClient";

// "Artes com IA" removido do menu (2026-09-06, pedido do Leonardo: "tire o
// gerador de arte de tudo, não faz sentido... hoje quero ser concorrente
// do Linktree, a pessoa não vai vender plaquinha, e sim biosite"). A
// página (/app/artes) e a rota de geração continuam existindo no código
// (não descontinuadas, só desacopladas do produto atual) — a plaquinha
// física vira um sistema separado, a pensar depois.
// "Cadastros" e "Agendamento" saíram deste menu (2026-09-07, bug real
// reportado ao vivo: "o Cadastros não sei se tá legal, vai aparecer de
// vários biosites que criei pra venda... isso deveria ser individual,
// no painel de cada biosite, não no meu painel de usuário"). Pra um
// revendedor com vários clientes, uma lista global misturando os
// contatos/reservas de negócios completamente diferentes não serve de
// nada — cada bio site já tem "Cadastros deste site"/"Agendamentos"
// dentro do próprio editor (ver SiteBuilder.tsx, grupo Análise, com
// ?site=slug), que é o lugar certo. As páginas /app/leads e
// /app/bookings continuam existindo (chegam por ali), só não têm mais
// item aqui no menu principal.
// Sidebar agrupada por intenção (2026-09-08, referência Coonexta — doc
// "Toqy vs Coonexta": a sidebar antiga listava tudo no mesmo nível, o que
// fazia QR/Analytics/Domínio/Revenda parecerem módulos desconectados
// mesmo pertencendo ao mesmo fluxo de negócio). URLs não mudam — só a
// organização visual. "Cadastros"/"Agendamento" continuam fora daqui de
// propósito (ver nota grande abaixo, decisão de 2026-09-07).
const NAV_GROUPS = [
  { label: "Visão geral", items: [
    { href: "/app", icon: Home, label: "Painel" },
  ] },
  { label: "Meus canais", items: [
    { href: "/app/qr", icon: QrCode, label: "QR Codes" },
    { href: "/app/dominio", icon: Globe, label: "Domínio próprio" },
  ] },
  { label: "Clientes e crescimento", items: [
    { href: "/onboarding", icon: Users, label: "Novo cliente" },
    { href: "/app/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/app/revenda", icon: Handshake, label: "Revenda" },
  ] },
  { label: "Conta", items: [
    { href: "/app/configuracoes", icon: Settings, label: "Configurações" },
  ] },
];
const navItems = NAV_GROUPS.flatMap((g) => g.items);
function navByHref(href: string) {
  return navItems.find((i) => i.href === href)!;
}

// Navegação em abas no mobile (2026-09-06, pedido do Leonardo depois de
// analisar o app do Linktree: "pense no Toqy como um app futuro" — o
// Linktree usa uma barra fixa de abas no rodapé, não menu-hambúrguer). O
// desktop continua com a sidebar de sempre (não faz sentido tab bar em
// tela grande); no mobile os 3 itens mais usados ficam fixos + "Mais"
// abre o resto (mesmo padrão do Linktree: itens essenciais + overflow).
const MOBILE_TAB_ITEMS = [navByHref("/app"), navByHref("/app/qr"), navByHref("/app/analytics")];
const MOBILE_MORE_ITEMS = [navByHref("/onboarding"), navByHref("/app/dominio"), navByHref("/app/revenda"), navByHref("/app/configuracoes")];

// Painel de quem só quer 1 biosite pro próprio negócio (2026-09-07,
// referência Coonexta — print enviado pelo Leonardo: 3 itens só —
// "Meu biosite" / "Meu perfil" / "Assinar PRO"). O Toqy já distingue
// esses dois públicos no MODELO DE PLANOS (Gratuito/Pro = maxSites 1,
// "pra quem quer um bio site completo só pro próprio negócio" — ver
// subscriptions.ts) — faltava a NAVEGAÇÃO refletir essa mesma divisão.
// maxSites > 1 (Essencial/Freelancer/Agência) continua com o menu
// completo de sempre (é quem revende bio sites pra clientes).
function singleSiteNavItems(planTier: string) {
  return [
    { href: "/app", icon: Home, label: "Meu biosite" },
    { href: "/app/configuracoes", icon: Settings, label: "Meu perfil" },
    { href: "/#planos", icon: Crown, label: planTier === "free" ? "Assinar PRO" : "Meu plano" },
  ];
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [atLimit, setAtLimit] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");
  const [moreOpen, setMoreOpen] = useState(false);
  const [isSingleSitePlan, setIsSingleSitePlan] = useState(false);
  const [planTier, setPlanTier] = useState("free");
  const [isAdmin, setIsAdmin] = useState(false);

  // Fecha o painel "Mais" automaticamente ao navegar
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    async function checkLimit() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Foto e inicial do usuário
      const meta = session.user.user_metadata;
      setUserAvatar(meta?.avatar_url || meta?.picture || null);
      setUserInitial((meta?.full_name || meta?.name || session.user.email || "U").charAt(0).toUpperCase());

      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("biosites_limit, plan_toqy, plan_tier, is_admin").eq("id", session.user.id).maybeSingle(),
        supabase.from("toqy_biosites").select("id", { count: "exact", head: true }).eq("owner_profile_id", session.user.id),
      ]);

      const limit = profile?.biosites_limit ?? 1;
      setAtLimit((count ?? 0) >= limit);
      setIsSingleSitePlan(limit <= 1);
      setPlanTier((profile?.plan_toqy || profile?.plan_tier || "free") as string);
      setIsAdmin(Boolean((profile as { is_admin?: boolean } | null)?.is_admin));
    }
    checkLimit();
  }, [pathname]);

  const activeNavItems = isSingleSitePlan ? singleSiteNavItems(planTier) : navItems;
  const activeMobileTabs = isSingleSitePlan ? activeNavItems : MOBILE_TAB_ITEMS;
  const activeMobileMore = isSingleSitePlan ? [] : MOBILE_MORE_ITEMS;

  return (
    <main className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar — só desktop agora (2026-09-06: o mobile trocou o menu-
          hambúrguer por uma barra de abas fixa no rodapé, ver mais abaixo
          — mesmo padrão do app do Linktree que o Leonardo mandou). */}
      <aside className="hidden lg:flex lg:h-auto lg:min-h-screen w-[260px] bg-card border-r border-border flex-col p-4">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-2 py-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold tracking-tight text-ink">Toqy</span>
            </Link>
          </div>

          {atLimit && isSingleSitePlan ? null : atLimit ? (
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

          <nav className="mt-6 flex-1 space-y-4">
            {isSingleSitePlan ? (
              <div className="space-y-1">
                {activeNavItems.map((item) => {
                  const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                  return <Nav key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} active={active} />;
                })}
              </div>
            ) : (
              NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-muted">{group.label}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                      return <Nav key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} active={active} />;
                    })}
                  </div>
                </div>
              ))
            )}
            {/* Admin (2026-09-08) — só quem tem profiles.is_admin=true
                (hoje, só o Leonardo) vê este item; a página em si também
                confere de novo, não depende só de esconder o link. Fica de
                fora dos grupos de negócio de propósito — é área técnica,
                não uma tarefa do dia a dia do dono do bio site (doc "Toqy
                vs Coonexta", 7.1: "não deve aparecer na navegação normal
                do cliente"). */}
            {isAdmin ? (
              <div>
                <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-muted">Admin</p>
                <Nav href="/app/admin/suporte" icon={<Headset className="h-5 w-5" />} label="Suporte (admin)" active={pathname.startsWith("/app/admin")} />
              </div>
            ) : null}
          </nav>

          {/* Logout (2026-09-08: tirada a duplicação — antes aparecia aqui
              E no cabeçalho ao mesmo tempo no desktop, ver doc "Toqy vs
              Coonexta", 7.2). Fica só aqui, fora dos grupos de navegação. */}
          <div className="border-t border-border pt-3">
            <LogoutButton />
          </div>

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
          <div className="flex items-center gap-2">
            <img src="/brand/favicon-toqy.png" alt="TOQY" className="h-7 w-7 rounded-lg lg:hidden" />
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
          </div>
        </header>

        {/* pb-24 no mobile: espaço pra barra de abas fixa não cobrir o
            fim do conteúdo (a barra em si tem ~64px + área segura) */}
        <section className="min-w-0 p-4 pb-24 md:p-8 lg:pb-8 flex-1">
          <div className="mx-auto max-w-7xl">{children}</div>
        </section>
      </div>

      {/* Barra de abas fixa (mobile) — 3 essenciais + "Mais" (2026-09-06,
          padrão do app do Linktree: nav de app de verdade em vez de menu
          escondido atrás de hambúrguer). */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {activeMobileTabs.map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${active ? "text-accent" : "text-muted"}`}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        {/* Só faz sentido "Mais" quando há itens escondidos — usuário de
            plano single-site já vê os 3 únicos itens na barra principal. */}
        {activeMobileMore.length ? (
          <button type="button" onClick={() => setMoreOpen((v) => !v)} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${moreOpen ? "text-accent" : "text-muted"}`}>
            <MoreHorizontal className="h-5 w-5" />
            Mais
          </button>
        ) : null}
      </nav>

      {/* Painel "Mais" — sobe de baixo, mesmo padrão de bottom-sheet do
          Linktree pro que não cabe na barra principal. */}
      {moreOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-50 rounded-t-3xl border border-border bg-card p-3 shadow-2xl lg:hidden">
            {activeMobileMore.map((item) => {
              const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return <Nav key={item.href} href={item.href} icon={<item.icon className="h-5 w-5" />} label={item.label} active={active} />;
            })}
            <div className="mt-2 border-t border-border pt-2">
              <LogoutButton />
            </div>
          </div>
        </>
      ) : null}

      {/* Chat de suporte flutuante (2026-09-08) — qualquer conta logada,
          em toda página do painel. */}
      <SupportChatWidget />
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
