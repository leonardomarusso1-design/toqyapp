"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { hasSupabaseBrowserEnv } from "@/lib/supabaseBrowser";
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
  inactive: "Ativa", // plano free sempre ativo
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [count, setCount] = useState(0);
  const [appUrl, setAppUrl] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setSupabaseReady(hasSupabaseBrowserEnv());
      setAppUrl(window.location.origin);

      if (!hasSupabaseBrowserEnv()) {
        setCount(0);
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const [{ data: profileData, error: profileError }, { count: biositesCount, error: biositesError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("toqy_biosites").select("id", { count: "exact", head: true }).eq("owner_profile_id", session.user.id),
      ]);

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (biositesError) {
        throw new Error(biositesError.message);
      }

      if (!active) {
        return;
      }

      setProfile(profileData as Profile);
      setCount(biositesCount ?? 0);
      setLoading(false);
    };

    loadDashboard().catch(() => {
      if (!active) return;
      setCount(0);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function exportData() {
    const data = window.localStorage.getItem("toqy_sites_v4") ?? "[]";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "toqy-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearLocalData() {
    if (!window.confirm("Isso vai apagar os bio sites criados neste navegador (modo demonstração). Continuar?")) return;
    window.localStorage.removeItem("toqy_sites_v4");
    window.localStorage.removeItem("toqy_deleted_mock_sites_v1");
    window.location.reload();
  }

  const planTier = (profile?.plan_toqy || profile?.plan_tier || "free") as PlanTier;
  const planLabel = PLAN_LABELS[planTier] ?? PLAN_LABELS.free;
  const subscriptionLabel = SUBSCRIPTION_LABELS[profile?.subscription_status ?? "active"] ?? "Ativa";
  const planLimit = PLAN_BIOSITE_LIMITS[planTier] ?? PLAN_BIOSITE_LIMITS.free;
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
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#31c4a8]"><UserRound className="h-5 w-5" /></span>
              <h2 className="text-xl font-black">Conta</h2>
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