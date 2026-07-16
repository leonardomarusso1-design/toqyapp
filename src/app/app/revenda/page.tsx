"use client";

import { useEffect, useState } from "react";
import { Copy, Handshake, Loader2, Mail, Users, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import { formatPrice } from "@/lib/subscriptions";

type Reseller = {
  reseller_code: string | null;
  status: "pending_invite" | "active" | "suspended";
  kiwify_affiliate_id: string | null;
  commission_pct: number;
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

// Revenue Share — Agência (Fase 2 do roadmap, 2026-07-15) — painel do
// revendedor. Segue o mesmo padrão de src/app/app/clientes/page.tsx
// (sessão client-side, queries direto no Supabase). Leitura das 3 tabelas
// novas funciona sob as RLS policies de owner-read já existentes (ver
// supabase/migrations/2026-07-16_agency_revenue_share.sql) — sem precisar
// de service role.
export default function RevendaPage() {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [origin, setOrigin] = useState("");
  const [isAgency, setIsAgency] = useState(false);
  const [joining, setJoining] = useState(false);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [managedClients, setManagedClients] = useState<ManagedClient[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  async function loadAll() {
    setOrigin(window.location.origin);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setAccessToken(session.access_token);

    const { data: profile } = await supabase.from("profiles").select("plan_toqy").eq("id", session.user.id).maybeSingle();
    const agency = profile?.plan_toqy === "agency";
    setIsAgency(agency);

    if (agency) {
      const [{ data: resellerRow }, { data: clients }, { data: ledger }] = await Promise.all([
        supabase.from("toqy_resellers").select("reseller_code, status, kiwify_affiliate_id, commission_pct").eq("profile_id", session.user.id).maybeSingle(),
        supabase.from("toqy_managed_clients").select("id, invite_email, status, created_at").eq("reseller_profile_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("toqy_commission_ledger").select("id, product_name, sale_amount_cents, commission_amount_cents, attribution_status, occurred_at").eq("reseller_profile_id", session.user.id).order("occurred_at", { ascending: false }),
      ]);
      setReseller(resellerRow ?? null);
      setManagedClients(clients ?? []);
      setCommissions(ledger ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function joinAsReseller() {
    setJoining(true);
    try {
      const res = await fetch("/api/resellers/join", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) await loadAll();
    } finally {
      setJoining(false);
    }
  }

  async function copyLink() {
    if (!reseller?.reseller_code) return;
    const link = `${origin}/login?revenda=${reseller.reseller_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // navigator.clipboard pode recusar silenciosamente (contexto sem
      // permissão, iframe, navegador antigo) — fallback: seleciona o texto
      // pra copiar manual, já que window.prompt não é bloqueado por permissão.
      window.prompt("Copie o link:", link);
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
        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Revenda</p>
        <h1 className="mt-1 text-4xl font-black text-ink">Programa de revenda Agência</h1>
        <p className="mt-1 text-sm text-muted">Acesso gratuito à plataforma white-label + 30% de comissão pro Toqy sobre cada venda que você fizer — 70% fica com você.</p>
      </div>

      {!isAgency ? (
        <div className="mt-6 rounded-[2rem] border-2 border-accent bg-gradient-to-br from-accent/10 via-card to-card p-6 shadow-xl shadow-accent/10">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-black uppercase tracking-wider text-white">Grátis</span>
          </div>
          <h2 className="mt-3 flex items-center gap-2 text-2xl font-black text-ink"><Handshake className="h-6 w-6 text-accent" />Torne-se um revendedor Agência</h2>
          <p className="mt-2 text-sm text-muted">Ganhe acesso gratuito à plataforma white-label (até 100 bio sites, domínio próprio) e 30% de comissão sobre cada venda que seus clientes fizerem — a Kiwify paga automaticamente pelo seu link de afiliado.</p>
          <button type="button" onClick={joinAsReseller} disabled={joining} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white transition hover:bg-accent-dim disabled:opacity-50">
            {joining ? "Ativando..." : "Virar revendedor agora"}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-ink"><Wallet className="h-4 w-4 text-accent" />Total ganho</p>
              <p className="mt-2 text-3xl font-black text-ink">{formatPrice(totalEarnedCents / 100)}</p>
              <p className="mt-1 text-xs text-muted">Comissões confirmadas ({reseller?.commission_pct ?? 70}% sobre venda dos seus clientes)</p>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-ink"><Users className="h-4 w-4 text-accent" />Clientes gerenciados</p>
              <p className="mt-2 text-3xl font-black text-ink">{managedClients.length}</p>
              <p className="mt-1 text-xs text-muted">{managedClients.filter((c) => c.status === "active").length} ativo{managedClients.filter((c) => c.status === "active").length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {reseller?.kiwify_affiliate_id ? null : (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              ⏳ Aguardando cadastro como afiliado na Kiwify — fale com o suporte pra ativar o recebimento automático de comissão.
            </div>
          )}

          <div className="mt-4 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm font-black text-ink">Seu link de revenda</p>
            <p className="mt-1 text-xs text-muted">Compartilhe — quem se cadastrar por ele vira seu cliente gerenciado automaticamente.</p>
            {reseller?.reseller_code ? (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-accent/30 bg-surface px-4 py-3">
                <span className="flex-1 truncate text-sm font-black text-ink">{origin}/login?revenda={reseller.reseller_code}</span>
                <button type="button" onClick={copyLink} className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-xs font-black text-white hover:bg-accent-dim">
                  <Copy className="h-3.5 w-3.5" />{copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            ) : (
              // Bug real corrigido (2026-07-15): quem já era plan_toqy='agency'
              // ANTES de existir a rota /api/resellers/join (ex: backfill da
              // Fase 2A) nunca tinha reseller_code gerado, e só via o botão
              // de gerar em Estado A (plan_toqy !== 'agency') — que essas
              // contas nunca atingem. Sem isso, o link ficava mostrando "..."
              // pra sempre, com o botão de copiar sem nada útil pra copiar.
              <button type="button" onClick={joinAsReseller} disabled={joining} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-black text-white hover:bg-accent-dim disabled:opacity-50">
                {joining ? "Gerando..." : "Gerar meu link de revenda"}
              </button>
            )}

            <form onSubmit={inviteClient} className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <div className="relative flex-1 min-w-[220px]">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="E-mail do cliente" className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-accent" />
              </div>
              <button type="submit" disabled={inviting} className="rounded-xl bg-ink px-4 py-2 text-xs font-black text-white disabled:opacity-50">
                {inviting ? "Enviando..." : "Convidar"}
              </button>
              {inviteMessage ? <p className="w-full text-xs font-bold text-muted">{inviteMessage}</p> : null}
            </form>
          </div>

          <div className="mt-4 rounded-[2rem] border border-border bg-card shadow-sm">
            <p className="border-b border-border p-4 text-sm font-black text-ink">Clientes gerenciados</p>
            {managedClients.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Nenhum cliente ainda — compartilhe seu link ou convide por e-mail.</p>
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
