"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Limpeza (2026-09-06, auditoria externa): CheckCircle2 foi removido do
// import — nenhum JSX desta página usava o ícone, só pesava o bundle.
import { LogOut, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHero } from "@/components/DashboardHero";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { PLAN_BIOSITE_LIMITS } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;

type BioSiteRow = {
  id: string;
  slug: string;
  status: string;
  name?: string;
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
  pro: "Pro",
  community: "Essencial",
  freelancer: "Freelancer",
  agency: "Agência",
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: "Ativa",
  canceled: "Cancelada",
  past_due: "Pagamento pendente",
  inactive: "Ativa", // plano free sempre ativo
};

export default function PainelPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [biosites, setBiosites] = useState<BioSiteRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Rotacao de chave de edicao (2026-09-06, item 3.1 da auditoria externa).
  // Existe porque a chave ficou exposta publicamente num vazamento
  // corrigido no mesmo dia — chave copiada continua valendo, e sem isso a
  // unica saida seria trocar a de todo mundo de uma vez.
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [novaChave, setNovaChave] = useState<{ slug: string; chave: string } | null>(null);
  // Bio site principal + avatar alimentam o topo em formato de app
  // (DashboardHero). "Principal" = o mais recente, mesma ordem da lista.
  const [heroSite, setHeroSite] = useState<ToqySite | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  async function handleRotateKey(site: BioSiteRow) {
    if (!window.confirm(`Gerar nova chave para "${site.slug}"?

A chave atual para de funcionar na hora. Quem usa a antiga (voce ou o cliente) precisa receber a nova.`)) return;
    setRotatingId(site.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/sites/${encodeURIComponent(site.slug)}/rotate-key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) { window.alert(body?.message || "Nao foi possivel gerar a nova chave."); return; }
      setNovaChave({ slug: site.slug, chave: body.editKey as string });
    } finally {
      setRotatingId(null);
    }
  }

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
        supabase.from("toqy_biosites").select("id, slug, status, name").eq("owner_profile_id", session.user.id).order("created_at", { ascending: false }),
      
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
      const meta = session.user.user_metadata;
      setAvatarUrl(meta?.avatar_url || meta?.picture || null);
      setLoading(false);

      // Carregado depois do resto: o site_data inteiro é pesado e só
      // alimenta a prévia do topo — não vale segurar o painel por ele.
      const sites = await listBiositesFromSupabase();
      if (active) setHeroSite(sites[0] ?? null);
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

  // Botão online/offline (pedido do Leonardo, 2026-09-05): usuários que
  // vendem o biosite pra um cliente final e cobram por assinatura/mensalidade
  // (fora da Kiwify, combinado direto com o cliente) precisam de um jeito de
  // tirar o site do ar se o cliente parar de pagar, sem precisar excluir.
  // A página pública (/b/[slug]) e a RLS já só liberam leitura com
  // status=active (ver biositeSync.ts) — só faltava esse botão. "draft"
  // conta como offline aqui (mesmo efeito pro visitante: página fora do ar).
  async function handleToggleStatus(site: BioSiteRow) {
    const nextStatus = site.status === "active" ? "disabled" : "active";
    setTogglingId(site.id);
    const { error } = await supabase.from("toqy_biosites").update({ status: nextStatus }).eq("id", site.id);
    if (!error) {
      setBiosites((prev) => prev.map((s) => (s.id === site.id ? { ...s, status: nextStatus } : s)));
    }
    setTogglingId(null);
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
      <DashboardHero site={heroSite} name={displayName} planLabel={planLabel} avatarUrl={avatarUrl} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><UserRound className="h-5 w-5" /></span>
              <h2 className="text-xl font-black text-ink">Conta</h2>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-black text-ink transition hover:border-violet/30 hover:text-violet">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between"><dt className="font-bold text-muted">Nome</dt><dd className="font-black text-ink">{loading ? "Carregando..." : displayName}</dd></div>
            <div className="flex items-center justify-between"><dt className="font-bold text-muted">E-mail</dt><dd className="font-black text-ink">{loading ? "Carregando..." : displayEmail}</dd></div>
            <div className="flex items-center justify-between"><dt className="font-bold text-muted">Páginas criadas</dt><dd className="font-black text-ink">{count}</dd></div>
          </dl>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-black text-ink">Plano atual</h2>
          <p className="mt-2 text-sm text-muted">Acompanhe seu plano, assinatura e uso atual de biosites.</p>
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
            <p className="text-2xl font-black text-emerald-950">{loading ? "Carregando..." : planLabel}</p>
            <p className="text-sm font-bold text-emerald-800">Status da assinatura: {loading ? "Carregando..." : subscriptionLabel}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-bold text-muted">
              <span>Biosites criados</span>
              <span>{count} / {planLimit}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-gradient-to-r from-accent to-violet transition-all" style={{ width: `${usagePercentage}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted">{Math.round(usagePercentage)}% do limite do plano utilizado.</p>
          </div>
          {planTier === "free" ? (
            <div className="mt-4 rounded-2xl border border-violet/20 bg-violet/10 p-4">
              <p className="text-base font-black text-ink">Faça upgrade para criar mais biosites!</p>
              <p className="mt-1 text-sm font-medium text-muted">Desbloqueie mais páginas e recursos avançados para sua conta.</p>
              <Link href="/#planos" className="mt-4 inline-flex rounded-2xl bg-violet px-5 py-3 text-sm font-black text-white transition hover:opacity-90">Ver planos</Link>
            </div>
          ) : null}
          {isNearLimit ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Você está próximo do limite do seu plano. Considere fazer upgrade para continuar criando biosites sem bloqueios.
            </div>
          ) : null}
          <Link href="/#planos" className="mt-4 inline-flex rounded-2xl border border-border px-5 py-3 text-sm font-black text-ink transition hover:border-accent hover:text-accent-dim">Ver todos os planos</Link>
        </section>

        {/* Lista de bio sites */}
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-ink">Meus bio sites</h2>
            {/* Chave nova aparece UMA vez, aqui (2026-09-06). Depois disso
                ela so volta a ser vista em /me pelo dono — nunca em
                superficie publica, ver toPublicSite(). */}
            {novaChave ? (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-black text-emerald-900">Nova chave de {novaChave.slug}</p>
                <p className="mt-1 font-mono text-2xl font-black text-emerald-700">{novaChave.chave}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-800">
                  A chave antiga parou de funcionar agora. Envie esta para quem edita o bio site.
                </p>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(novaChave.chave); setNovaChave(null); }}
                  className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                >
                  Copiar e fechar
                </button>
              </div>
            ) : null}
            <Link href="/app/novo" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-black text-white hover:bg-accent-dim">+ Novo</Link>
          </div>
          {biosites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center">
              <p className="text-sm font-bold text-muted">Nenhum bio site criado ainda.</p>
              <Link href="/app/novo" className="mt-3 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white">Criar primeiro bio site</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {biosites.map(site => {
                const name = site.name || site.slug;
                return (
                  <div key={site.id} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-ink truncate">{name}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${site.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                            {site.status === "active" ? "Online" : "Offline"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-mono text-muted">toqy.com.br/b/<strong>{site.slug}</strong></p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => handleToggleStatus(site)}
                          disabled={togglingId === site.id}
                          title={site.status === "active" ? "Tirar do ar (ex: cliente parou de pagar a mensalidade)" : "Colocar no ar de novo"}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-black disabled:opacity-40 ${
                            site.status === "active"
                              ? "border-red-200 bg-card text-red-500 hover:bg-red-50"
                              : "border-emerald-200 bg-card text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {togglingId === site.id ? "..." : site.status === "active" ? "Deixar offline" : "Colocar online"}
                        </button>
                        <Link href={`/b/${site.slug}`} target="_blank" className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-black text-ink hover:border-accent">Ver</Link>
                        {/* Fix de bug real (2026-07-16): antes montava
                            /editar/${slug}?key=${edit_key_hash} — desde que
                            edit_key_hash virou bcrypt de verdade (item 2 da
                            auditoria), isso nunca mais batia no
                            verify_biosite_key(). O dono logado agora entra
                            direto via sessao (ver tryUnlockBySession em
                            /editar/[slug]), sem precisar de chave nenhuma. */}
                        <Link href={`/editar/${site.slug}`} className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-black text-ink hover:border-accent">Editar</Link>
                        <button
                          type="button"
                          onClick={() => handleRotateKey(site)}
                          disabled={rotatingId === site.id}
                          title="Gera uma chave de edicao nova e invalida a atual"
                          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-black text-muted hover:border-accent hover:text-accent-dim disabled:opacity-40"
                        >
                          {rotatingId === site.id ? "..." : "Nova chave"}
                        </button>
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
                            <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-black text-muted">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(site.id)} disabled={deletingId === site.id} className="rounded-xl border border-red-200 bg-card px-3 py-1.5 text-xs font-black text-red-500 hover:bg-red-50 disabled:opacity-40">
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