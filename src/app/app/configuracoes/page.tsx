"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { PLAN_BIOSITE_LIMITS } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";

type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: PlanTier | null;
  plan_toqy?: PlanTier | null;
  biosites_limit?: number;
  subscription_status: string | null;
};

const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Gratuito",
  community: "Comunidade",
  freelancer: "Freelancer",
  agency: "Agência",
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: "Ativa",
  canceled: "Cancelada",
  past_due: "Pagamento pendente",
  inactive: "Ativa",
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMeta, setUserMeta] = useState<{ avatar_url?: string; picture?: string; full_name?: string } | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }
      setUserMeta(session.user.user_metadata || null);

      const [{ data: profileData, error: profileError }, { count: biositesCount, error: biositesError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("toqy_biosites").select("id", { count: "exact", head: true }).eq("owner_profile_id", session.user.id),
      ]);

      if (profileError || biositesError) {
        setCount(biositesCount ?? 0);
        if (profileData) setProfile(profileData as Profile);
        setLoading(false);
        return;
      }

      if (!active) return;

      setProfile(profileData as Profile);
      setCount(biositesCount ?? 0);
      setLoading(false);
    };

    loadDashboard().catch(() => {
      if (!active) return;
      setCount(0);
      setLoading(false);
    });

    return () => { active = false; };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const planTier = (profile?.plan_toqy || profile?.plan_tier || "free") as PlanTier;
  const planLabel = PLAN_LABELS[planTier] ?? PLAN_LABELS.free;
  const subscriptionLabel = SUBSCRIPTION_LABELS[profile?.subscription_status ?? "active"] ?? "Ativa";
  const planLimit = profile?.biosites_limit ?? PLAN_BIOSITE_LIMITS[planTier] ?? PLAN_BIOSITE_LIMITS.free;
  const usagePercentage = planLimit > 0 ? Math.min((count / planLimit) * 100, 100) : 0;
  const isNearLimit = usagePercentage > 80;
  const displayName = profile?.full_name?.trim() || "Usuário";
  const displayEmail = profile?.email ?? "—";

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Configurações</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Configurações</h1>
        <p className="mt-2 max-w-2xl text-slate-500">Conta, plano, integrações e dados da sua conta TOQY.</p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100">
              {userMeta?.avatar_url || userMeta?.picture ? (
                  <img src={userMeta.avatar_url || userMeta.picture} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-slate-600">{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-black">Conta</h2>
                <p className="text-sm text-slate-500">{displayName}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between"><dt className="font-bold text-slate-500">Nome</dt><dd className="font-black">{loading ? "Carregando..." : displayName}</dd></div>
            <div className="flex items-center justify-between"><dt className="font-bold text-slate-500">E-mail</dt><dd className="font-black">{loading ? "Carregando..." : displayEmail}</dd></div>
            <div className="flex items-center justify-between"><dt className="font-bold text-slate-500">Páginas criadas</dt><dd className="font-black">{count}</dd></div>
          </dl>
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Plano atual</h2>
          <p className="mt-2 text-sm text-slate-500">Acompanhe seu plano, assinatura e uso atual de biosites.</p>
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
            <p className="text-2xl font-black text-emerald-950">{loading ? "Carregando..." : planLabel}</p>
            <p className="text-sm font-bold text-emerald-800">Status da assinatura: {loading ? "Carregando..." : subscriptionLabel}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-600">
              <span>Biosites criados</span>
              <span>{count} / {planLimit}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all" style={{ width: `${usagePercentage}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-500">{Math.round(usagePercentage)}% do limite do plano utilizado.</p>
          </div>
          {planTier === "free" ? (
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-base font-black text-indigo-900">Faça upgrade para criar mais biosites!</p>
              <p className="mt-1 text-sm font-medium text-indigo-800">Desbloqueie mais páginas e recursos avançados para sua conta.</p>
              <Link href="/#planos" className="mt-4 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700">Ver planos</Link>
            </div>
          ) : null}

          {planTier === "community" ? (
            <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-950 p-5">
              <div className="flex items-center gap-3">
                <svg className="h-7 w-7 shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <div>
                  <p className="font-black text-white">Comunidade TOQY</p>
                  <p className="text-xs text-indigo-300">Servidor exclusivo no Discord</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-indigo-200/70">Tire dúvidas, receba novidades e conecte-se com outros membros.</p>
              <a href="https://discord.gg/EsjFsRVyCC" target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-indigo-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Entrar no Discord
              </a>
            </div>
          ) : null}
          {isNearLimit ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Você está próximo do limite do seu plano. Considere fazer upgrade para continuar criando biosites sem bloqueios.
            </div>
          ) : null}
          <Link href="/#planos" className="mt-4 inline-flex rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8] hover:text-[#1f9f87]">Ver todos os planos</Link>
        </section>
      </div>
    </DashboardShell>
  );
}
