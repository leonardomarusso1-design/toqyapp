"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Handshake, Loader2, Mail, RefreshCw, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import { formatPrice } from "@/lib/subscriptions";
import type { ResellerTier, ResellerTierConfig } from "@/lib/resellerTiers";

type EnsureResponse =
  | { eligible: false }
  | {
      eligible: true;
      tier: ResellerTier;
      reseller_code: string;
      status: "pending_invite" | "active" | "suspended";
      kiwify_affiliate_id: string | null;
      tierConfig: ResellerTierConfig;
    };

type ManagedClient = {
  id: string;
  invite_email: string | null;
  status: "invited" | "active" | "removed";
  created_at: string;
};

type CommissionRow = {
  id: string;
  product_name: string | null;
  sale_amount_cents: number | null;
  commission_amount_cents: number | null;
  attribution_status: "matched" | "affiliate_mismatch" | "refunded";
  occurred_at: string | null;
};

// Programa de indicação com comissão (2026-07-15) — painel do revendedor.
// Substitui o desenho anterior "vire revendedor grátis" (ver histórico em
// subscriptions.ts): agora é um benefício automático de quem JÁ é
// Freelancer ou Agência pagante, não uma ação de upgrade. Elegibilidade e
// código são resolvidos por POST /api/resellers/ensure (idempotente,
// chamado sempre que a página carrega).
export default function RevendaPage() {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [origin, setOrigin] = useState("");
  const [ensureData, setEnsureData] = useState<EnsureResponse | null>(null);
  const [bonusSitesEarned, setBonusSitesEarned] = useState(0);
  const [managedClients, setManagedClients] = useState<ManagedClient[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  async function loadAll() {
    setOrigin(window.location.origin);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setAccessToken(session.access_token);

    const ensureRes = await fetch("/api/resellers/ensure", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    const ensure = (await ensureRes.json().catch(() => ({ eligible: false }))) as EnsureResponse;
    setEnsureData(ensure);

    if (ensure.eligible) {
      const [{ data: profile }, { data: clients }, { data: ledger }] = await Promise.all([
        supabase.from("profiles").select("referral_bonus_biosites").eq("id", session.user.id).maybeSingle(),
        supabase.from("toqy_managed_clients").select("id, invite_email, status, created_at").eq("reseller_profile_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("toqy_commission_ledger").select("id, product_name, sale_amount_cents, commission_amount_cents, attribution_status, occurred_at").eq("reseller_profile_id", session.user.id).order("occurred_at", { ascending: false }),
      ]);
      setBonusSitesEarned(profile?.referral_bonus_biosites ?? 0);
      setManagedClients(clients ?? []);
      setCommissions(ledger ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function copyLink() {
    if (!ensureData?.eligible) return;
    const link = `${origin}/login?revenda=${ensureData.reseller_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // navigator.clipboard pode recusar silenciosamente (contexto sem
      // permissão, iframe, navegador antigo) — fallback: window.prompt não
      // é bloqueado por permissão, dá pra copiar manual.
      window.prompt("Copie o link:", link);
    }
  }

  async function syncAffiliate() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/resellers/sync-affiliate", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      const body = await res.json().catch(() => ({}));
      if (body.synced) {
        setSyncMessage("Comissão sincronizada com sucesso!");
        await loadAll();
      } else {
        setSyncMessage(body.message || body.error || "Não foi possível sincronizar agora.");
      }
    } finally {
      setSyncing(false);
    }
  }

  async function inviteClient(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMessage("");
    try {
      const res = await fetch("/api/resellers/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      if (res.ok) {
        setInviteEmail("");
        setInviteMessage("Convite registrado!");
        await loadAll();
      } else {
        const body = await res.json().catch(() => ({}));
        setInviteMessage(body.error || "Não foi possível registrar o convite.");
      }
    } finally {
      setInviting(false);
    }
  }

  const totalEarnedCents = commissions
    .filter((c) => c.attribution_status === "matched")
    .reduce((sum, c) => sum + (c.commission_amount_cents ?? 0), 0);

  const statusLabel: Record<ManagedClient["status"], string> = { invited: "Convidado", active: "Ativo", removed: "Removido" };
  const attributionLabel: Record<CommissionRow["attribution_status"], string> = { matched: "OK", affiliate_mismatch: "Verificar", refunded: "Reembolsado" };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Indicação</p>
        <h1 className="mt-1 text-4xl font-black text-ink">Ganhe indicando o Toqy</h1>
        <p className="mt-1 text-sm text-muted">Benefício de quem assina Freelancer ou Agência — comissão automática, desconto pra quem você indicar, e bio sites de bônus a cada venda.</p>
      </div>

      {!ensureData?.eligible ? (
        <div className="mt-6 rounded-[2rem] border border-dashed border-border bg-surface p-6 text-center">
          <Handshake className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-2 font-black text-ink">Disponível a partir do plano Freelancer</p>
          <p className="mt-1 text-sm text-muted">Assine Freelancer (20% de comissão) ou Agência (30%) pra ganhar seu link de indicação.</p>
          <Link href="/#planos" className="mt-4 inline-flex rounded-2xl bg-accent px-5 py-2.5 text-sm font-black text-white hover:bg-accent-dim">Ver planos</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-ink"><Wallet className="h-4 w-4 text-accent" />Total ganho</p>
              <p className="mt-2 text-3xl font-black text-ink">{formatPrice(totalEarnedCents / 100)}</p>
              <p className="mt-1 text-xs text-muted">{ensureData.tierConfig.commissionPct}% sobre venda dos seus indicados</p>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-ink"><Users className="h-4 w-4 text-accent" />Indicados</p>
              <p className="mt-2 text-3xl font-black text-ink">{managedClients.length}</p>
              <p className="mt-1 text-xs text-muted">{managedClients.filter((c) => c.status === "active").length} ativo{managedClients.filter((c) => c.status === "active").length !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-black text-ink">Bio sites de bônus</p>
              <p className="mt-2 text-3xl font-black text-ink">+{bonusSitesEarned}</p>
              <p className="mt-1 text-xs text-muted">+{ensureData.tierConfig.bonusSites} a cada venda confirmada</p>
            </div>
          </div>

          {ensureData.kiwify_affiliate_id ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              ✓ Comissão ativa na Kiwify ({ensureData.tierConfig.commissionPct}%)
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-800">⏳ Falta 1 passo pra sua comissão funcionar de verdade</p>
              <p className="mt-1 text-xs text-amber-800">Candidate-se como afiliado (aprovação automática, 1 clique) — depois volte aqui e clique em sincronizar.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={ensureData.tierConfig.kiwifyAffiliateApplyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-amber-800 px-4 py-2 text-xs font-black text-amber-800 hover:bg-amber-100">
                  Candidatar-se como afiliado
                </a>
                <button type="button" onClick={syncAffiliate} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Sincronizando..." : "Já me candidatei, sincronizar"}
                </button>
              </div>
              {syncMessage ? <p className="mt-2 text-xs font-bold text-amber-800">{syncMessage}</p> : null}
            </div>
          )}

          <div className="mt-4 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-black text-ink">Seu link de indicação</p>
            <p className="mt-1 text-xs text-muted">Quem se cadastrar por ele ganha {ensureData.tierConfig.buyerDiscountPct}% de desconto em qualquer plano — e vira seu indicado automaticamente.</p>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-accent/30 bg-surface px-4 py-3">
              <span className="flex-1 truncate text-sm font-black text-ink">{origin}/login?revenda={ensureData.reseller_code}</span>
              <button type="button" onClick={copyLink} className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-xs font-black text-white hover:bg-accent-dim">
                <Copy className="h-3.5 w-3.5" />{copied ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <form onSubmit={inviteClient} className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <div className="relative flex-1 min-w-[220px]">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="E-mail de quem você quer indicar" className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-accent" />
              </div>
              <button type="submit" disabled={inviting} className="rounded-xl bg-ink px-4 py-2 text-xs font-black text-white disabled:opacity-50">
                {inviting ? "Enviando..." : "Convidar"}
              </button>
              {inviteMessage ? <p className="w-full text-xs font-bold text-muted">{inviteMessage}</p> : null}
            </form>
          </div>

          <div className="mt-4 rounded-[2rem] border border-border bg-card shadow-sm">
            <p className="border-b border-border p-4 text-sm font-black text-ink">Pessoas indicadas</p>
            {managedClients.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Ninguém ainda — compartilhe seu link ou convide por e-mail.</p>
            ) : (
              <div className="divide-y divide-border">
                {managedClients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 text-sm">
                    <span className="font-bold text-ink">{c.invite_email ?? "—"}</span>
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-black text-muted">{statusLabel[c.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[2rem] border border-border bg-card shadow-sm">
            <p className="border-b border-border p-4 text-sm font-black text-ink">Comissões</p>
            {commissions.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Nenhuma venda registrada ainda.</p>
            ) : (
              <div className="divide-y divide-border">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                    <div>
                      <p className="font-bold text-ink">{c.product_name ?? "Venda"}</p>
                      <p className="text-xs text-muted">{c.occurred_at ? new Date(c.occurred_at).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-ink">{formatPrice((c.commission_amount_cents ?? 0) / 100)}</p>
                      <span className={`text-xs font-black ${c.attribution_status === "matched" ? "text-emerald-600" : "text-amber-600"}`}>{attributionLabel[c.attribution_status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
