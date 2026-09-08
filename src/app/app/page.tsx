"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Limpeza (2026-09-06, auditoria externa): CheckCircle2 foi removido do
// import — nenhum JSX desta página usava o ícone, só pesava o bundle.
import { Check, Copy, MoreVertical, Plus } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { DashboardHero } from "@/components/DashboardHero";
import { PLAN_BIOSITE_LIMITS } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";

type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;

type BioSiteRow = {
  id: string;
  slug: string;
  status: string;
  name?: string;
  editKey?: string;
};

// Dados mínimos do site_data usados só pra montar o checklist abaixo — não
// vale a pena tipar ToqySite inteiro aqui, a página não edita nada disso.
type ChecklistSiteData = {
  profile?: { logoUrl?: string; profileImageUrl?: string };
  contact?: { whatsapp?: string };
  pix?: { enabled?: boolean; key?: string };
  catalog?: unknown[];
  services?: unknown[];
  leadForm?: { enabled?: boolean };
  businessHours?: { enabled?: boolean };
};

// Checklist operacional da CONTA (2026-09-08, Parte B do doc "Toqy vs
// Coonexta" — SEM números de tráfego agregados: essa parte foi tirada de
// propósito, ver nota grande em DashboardHero.tsx sobre a decisão de
// 2026-09-07 de não misturar estatísticas de clientes diferentes numa
// conta de revenda. Isso aqui é diferente — é "sua operação está com a
// base configurada?", não visitas/cliques, e olha o portfólio inteiro
// (OR entre os sites), não soma nada). Cada item só conta o que dá pra
// provar com dado real já carregado — nada de item tipo "QR baixado" que
// a gente não rastreia hoje.
function buildChecklist(rows: Array<{ status: string; data: ChecklistSiteData }>) {
  const some = (fn: (d: ChecklistSiteData) => boolean) => rows.some((r) => fn(r.data));
  return [
    { label: "Primeiro bio site publicado", done: rows.some((r) => r.status === "active") },
    { label: "Logo ou foto configurada", done: some((d) => Boolean(d.profile?.logoUrl || d.profile?.profileImageUrl)) },
    { label: "WhatsApp configurado", done: some((d) => Boolean(d.contact?.whatsapp?.trim())) },
    { label: "Pix configurado", done: some((d) => Boolean(d.pix?.enabled && d.pix?.key?.trim())) },
    { label: "Catálogo ou serviço adicionado", done: some((d) => Boolean(d.catalog?.length || d.services?.length)) },
    { label: "Formulário de contatos ativo", done: some((d) => Boolean(d.leadForm?.enabled)) },
    { label: "Horário de funcionamento configurado", done: some((d) => Boolean(d.businessHours?.enabled)) },
  ];
}

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

export default function PainelPage() {
  const router = useRouter();
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [checklistRows, setChecklistRows] = useState<Array<{ status: string; data: ChecklistSiteData }>>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function copyEditKey(site: BioSiteRow) {
    if (!site.editKey) return;
    navigator.clipboard.writeText(site.editKey);
    setCopiedKeyId(site.id);
    setTimeout(() => setCopiedKeyId((id) => (id === site.id ? null : id)), 2000);
  }

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
        supabase.from("toqy_biosites").select("id, slug, status, name, site_data").eq("owner_profile_id", session.user.id).order("created_at", { ascending: false }),
      
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
      // Chave de acesso visível na lista (2026-09-07, pedido real: "pra
      // quando eu esquecer, e o cliente também, mandar pra ele") — vem do
      // mesmo site_data.editKey que o editor já mostra na tela de "salvo
      // com sucesso", só que aqui, de uma vez, pra todos os sites.
      const rows = (biositesData ?? []) as Array<BioSiteRow & { site_data?: ChecklistSiteData & { editKey?: string } }>;
      setBiosites(rows.map((row) => ({ ...row, editKey: row.site_data?.editKey })));
      setChecklistRows(rows.map((row) => ({ status: row.status, data: row.site_data ?? {} })));
      const meta = session.user.user_metadata;
      setAvatarUrl(meta?.avatar_url || meta?.picture || null);
      setLoading(false);
    };

    loadDashboard().catch(() => {
      if (!active) return;
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

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
  const planLimit = profile?.biosites_limit ?? PLAN_BIOSITE_LIMITS[planTier] ?? PLAN_BIOSITE_LIMITS.free;
  const displayName = profile?.full_name?.trim() || "Usuário";
  // Gratuito/Pro = 1 bio site só, pro próprio negócio (2026-09-07,
  // referência Coonexta — print do Leonardo: painel de quem só quer 1
  // biosite entra direto no "Meu biosite", sem lista de múltiplos sites
  // no meio do caminho). Essencial/Freelancer/Agência (revenda) mantêm
  // o painel de sempre, sem nenhuma mudança abaixo.
  const isSingleSitePlan = planLimit <= 1;
  const checklist = buildChecklist(checklistRows);
  const draftSites = biosites.filter((s) => s.status === "draft");

  useEffect(() => {
    if (!loading && isSingleSitePlan && biosites.length >= 1) {
      router.replace(`/editar/${biosites[0].slug}`);
    }
  }, [loading, isSingleSitePlan, biosites, router]);

  if (isSingleSitePlan && !loading) {
    if (biosites.length >= 1) {
      // Redireciona pro editor do único site (efeito acima) — este
      // retorno só evita piscar a tela de "criar" por uma fração de
      // segundo antes do replace acontecer.
      return (
        <DashboardShell>
          <p className="mt-10 text-center text-sm font-bold text-muted">Abrindo seu bio site...</p>
        </DashboardShell>
      );
    }
    return (
      <DashboardShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-2xl font-black text-ink">Bora criar seu bio site?</p>
          <p className="mt-2 text-sm text-muted">Tudo pronto em minutos — nome, links, cores e catálogo, sem código.</p>
          <Link href="/app/novo" className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:bg-accent-dim">
            <Plus className="h-7 w-7" />
          </Link>
          <Link href="/app/novo" className="mt-4 text-sm font-black text-accent hover:underline">CRIAR MEU BIOSITE</Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHero name={displayName} planLabel={planLabel} avatarUrl={avatarUrl} />

      <div className="grid gap-5">
        {/* "Conta" e "Plano atual" saíram desta página (2026-09-07, bug
            real reportado ao vivo: "tá poluído, deviam estar em outro
            lugar") — já existem, melhor feitos (com usagePercentage,
            upgrade, Discord, cupom), em /app/configuracoes. Duplicar
            aqui só juntava informação que não é sobre UM bio site
            específico no meio da lista de bio sites. */}

        {/* Rascunho incompleto (2026-09-08, Parte B do doc "Toqy vs
            Coonexta") — status "draft" é o bio site criado mas nunca
            publicado. Chamada pra continuar de onde parou, antes de
            qualquer outra coisa na tela. */}
        {draftSites.length ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
            {draftSites.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-black text-amber-900">
                  &quot;{s.name || s.slug}&quot; ainda não foi publicado.
                </p>
                <Link href={`/editar/${s.slug}`} className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700">
                  Continuar configuração
                </Link>
              </div>
            ))}
          </section>
        ) : null}

        {/* Checklist operacional da conta (2026-09-08, Parte B) — só
            "portfólio configurado ou não", sem número de tráfego (ver
            buildChecklist acima pro motivo). Some sozinho quando tudo
            está marcado. */}
        {!loading && checklist.some((c) => !c.done) ? (
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-muted">Seu portfólio está pronto?</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {checklist.map((item) => (
                <div key={item.label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${item.done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-surface text-muted"}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-emerald-500 text-white" : "border border-border bg-card"}`}>
                    {item.done ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Lista de bio sites */}
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-black text-ink">Meus bio sites</h2>
            <Link href="/app/novo" className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-black text-white hover:bg-accent-dim">+ Novo</Link>
          </div>
          {/* Chave nova aparece UMA vez, aqui (2026-09-06). Depois disso ela
              so volta a ser vista em /me pelo dono — nunca em superficie
              publica, ver toPublicSite(). Bloco tirado da linha do
              cabeçalho (2026-09-08, bug real reportado ao vivo: "painel
              mobile, tá cortando a página em /app") — vivia como 3º irmão
              flex ao lado de "Meus bio sites"/"+ Novo" numa linha SEM
              flex-wrap; a chave (fonte grande, texto explicativo, botão)
              é larga demais pra caber ao lado dos outros dois num celular,
              e overflow-x:hidden global (globals.css) corta em vez de
              rolar — exatamente o sintoma relatado. Bloco próprio, w-full,
              sem concorrer com mais nada na mesma linha. */}
          {novaChave ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
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
                    {/* flex-col no celular (2026-09-08, bug real: "passando
                        pro lado direito da tela, não dá pra ver nada") — a
                        coluna de botões tinha shrink-0 (não encolhe) dentro
                        de uma linha sem quebra; num celular real, ela
                        simplesmente saía da tela pra direita, cortada pelo
                        overflow-x:hidden da página. Empilhado por padrão,
                        lado a lado só a partir de sm.
                        `items-start` só a partir de sm (2026-09-08, MESMO
                        bug reaberto — "ainda tá cortando"): em flex-col,
                        align-items controla a LARGURA (eixo cruzado vira
                        horizontal). `items-start` fazia o bloco de nome
                        (com `truncate`) encolher pro tamanho do PRÓPRIO
                        texto em vez de esticar pra largura do cartão —
                        nome de negócio comprido (ex: "Dra. Thaís Hassum -
                        Odontologia e Harmonização") nunca truncava,
                        alargava o card, e como o card mora no MESMO grid
                        de "Meus bio sites"/checklist/banner de rascunho,
                        alargava a página inteira junto — cortada pelo
                        overflow-x:hidden global. Sem `items-start` no
                        mobile, o padrão (stretch) faz o bloco esticar pra
                        100% da linha, e aí sim `min-w-0` + `truncate`
                        conseguem cortar o texto como deveriam. */}
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-ink truncate">{name}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${site.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                            {site.status === "active" ? "Online" : "Offline"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-mono text-muted">toqy.com.br/b/<strong>{site.slug}</strong></p>
                        {/* Chave de acesso visível aqui (2026-09-07, pedido
                            real: "pra quando eu esquecer, e o cliente
                            também, mandar pra ele") — antes só aparecia uma
                            vez na tela de "salvo com sucesso" ou via "Nova
                            chave" (que invalida a antiga); isso aqui só lê,
                            não gera nada novo. */}
                        {site.editKey ? (
                          <button type="button" onClick={() => copyEditKey(site)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs text-muted transition hover:border-accent hover:text-ink">
                            <Copy className="h-3 w-3 shrink-0" />
                            Chave: <strong>{site.editKey}</strong>
                            {copiedKeyId === site.id ? <span className="text-emerald-600">Copiado!</span> : null}
                          </button>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link href={`/b/${site.slug}`} target="_blank" className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-black text-ink hover:border-accent">Ver</Link>
                        {/* Fix de bug real (2026-07-16): antes montava
                            /editar/${slug}?key=${edit_key_hash} — desde que
                            edit_key_hash virou bcrypt de verdade (item 2 da
                            auditoria), isso nunca mais batia no
                            verify_biosite_key(). O dono logado agora entra
                            direto via sessao (ver tryUnlockBySession em
                            /editar/[slug]), sem precisar de chave nenhuma. */}
                        <Link href={`/editar/${site.slug}`} className="rounded-xl bg-accent px-3 py-1.5 text-xs font-black text-white hover:bg-accent-dim">Editar</Link>
                        {/* Ações secundárias num menu "..." (2026-09-08,
                            Parte B do doc "Toqy vs Coonexta": "QR,
                            Compartilhar, Nova chave e Offline devem ficar
                            em menu secundário"). Ver/Editar são as únicas
                            ações primárias visíveis direto no card agora. */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId((id) => (id === site.id ? null : site.id))}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-muted hover:border-accent hover:text-ink"
                            aria-label="Mais ações"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === site.id ? (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => { setOpenMenuId(null); setConfirmDelete(null); }} />
                              <div className="absolute right-0 top-full z-20 mt-1 w-56 space-y-1 rounded-2xl border border-border bg-card p-2 shadow-xl">
                                <button
                                  onClick={() => { handleToggleStatus(site); setOpenMenuId(null); }}
                                  disabled={togglingId === site.id}
                                  title={site.status === "active" ? "Tirar do ar (ex: cliente parou de pagar a mensalidade)" : "Colocar no ar de novo"}
                                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-black text-ink hover:bg-surface disabled:opacity-40"
                                >
                                  {togglingId === site.id ? "..." : site.status === "active" ? "Deixar offline" : "Colocar online"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { handleRotateKey(site); setOpenMenuId(null); }}
                                  disabled={rotatingId === site.id}
                                  title="Gera uma chave de edicao nova e invalida a atual"
                                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-black text-ink hover:bg-surface disabled:opacity-40"
                                >
                                  {rotatingId === site.id ? "..." : "Nova chave"}
                                </button>
                                {confirmDelete === site.id ? (
                                  <div className="flex gap-1 px-1">
                                    <button onClick={async () => {
                                      setDeletingId(site.id);
                                      setConfirmDelete(null);
                                      setOpenMenuId(null);
                                      await supabase.from("toqy_biosites").delete().eq("id", site.id);
                                      setBiosites(b => b.filter(s => s.id !== site.id));
                                      setDeletingId(null);
                                    }} className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white">Confirmar exclusão</button>
                                    <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-black text-muted">Cancelar</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDelete(site.id)} disabled={deletingId === site.id} className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-black text-red-500 hover:bg-red-50 disabled:opacity-40">
                                    {deletingId === site.id ? "..." : "Excluir"}
                                  </button>
                                )}
                              </div>
                            </>
                          ) : null}
                        </div>
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