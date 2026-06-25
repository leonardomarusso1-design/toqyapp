"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { PLAN_BIOSITE_LIMITS } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";

type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;

type BioSiteRow = {
  id: string;
  slug: string;
  status: string;
  site_data: { editKey?: string; profile?: { name?: string }; };
};

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
  const [count, setCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [biosites, setBiosites] = useState<BioSiteRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const [{ data: profileData, error: profileError }, { data: biositesData, error: biositesError }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, plan_tier, plan_toqy, biosites_limit, biosites_count, subscription_status").eq("id", session.user.id).single(),
        supabase.from("toqy_biosites").select("id, slug, status, site_data").eq("owner_profile_id", session.user.id).order("created_at", { ascending: false }),
      
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
      setBiosites((biositesData ?? []) as BioSiteRow[]);
      setCount((biositesData ?? []).length);
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

        {/* Lista de bio sites */}
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Meus bio sites</h2>
            <Link href="/app/novo" className="inline-flex items-center gap-2 rounded-2xl bg-[#31c4a8] px-4 py-2.5 text-sm font-black text-white hover:bg-[#25b69a]">+ Novo</Link>
          </div>
          {biosites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
              <p className="text-sm font-bold text-slate-400">Nenhum bio site criado ainda.</p>
              <Link href="/app/novo" className="mt-3 inline-flex rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">Criar primeiro bio site</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {biosites.map(site => {
                const name = site.site_data?.profile?.name || site.slug;
                const editKey = site.site_data?.editKey || "—";
                return (
                  <div key={site.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{name}</p>
                        <p className="mt-0.5 text-xs font-mono text-slate-500">toqy.com.br/b/<strong>{site.slug}</strong></p>
                        <p className="mt-0.5 text-xs text-slate-400">Chave: <span className="font-mono font-black text-slate-600">{editKey}</span></p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Link href={`/b/${site.slug}`} target="_blank" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:border-[#31c4a8]">Ver</Link>
                        <Link href={`/editar/${site.slug}?key=${editKey}`} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 hover:border-[#31c4a8]">Editar</Link>
                        {confirmDelete === site.id ? (
                          <div className="flex gap-1">
                            <button onClick={async () => {
                              setDeletingId(site.id);
                              setConfirmDelete(null);
                              await supabase.from("toqy_biosites").delete().eq("id", site.id);
                              setBiosites(b => b.filter(s => s.id !== site.id));
                              setCount(c => c - 1);
                              setDeletingId(null);
                            }} className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-black text-white">Confirmar</button>
                            <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-500">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(site.id)} disabled={deletingId === site.id} className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-black text-red-500 hover:bg-red-50 disabled:opacity-40">
                            {deletingId === site.id ? "..." : "Excluir"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}