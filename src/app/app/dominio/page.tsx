"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, RefreshCw, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";
import { resolvePlanTier } from "@/lib/subscriptions";

type BioSiteRow = { id: string; slug: string; name?: string; custom_domain: string | null; custom_domain_status: string | null };

type DomainApiResponse = { domain: string | null; status: string | null; error?: string; verification?: Array<{ type: string; domain: string; value: string }> | null };

export default function DominioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAgency, setIsAgency] = useState(false);
  const [sites, setSites] = useState<BioSiteRow[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [domainInput, setDomainInput] = useState("");
  const [status, setStatus] = useState<DomainApiResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      if (!active) return;
      setToken(session.access_token);

      const [{ data: profile }, { data: biositesData }] = await Promise.all([
        supabase.from("profiles").select("plan_toqy, plan_tier").eq("id", session.user.id).single(),
        supabase.from("toqy_biosites").select("id, slug, name, custom_domain, custom_domain_status").eq("owner_profile_id", session.user.id).order("created_at", { ascending: false }),
      ]);
      if (!active) return;

      const planTier = resolvePlanTier(profile?.plan_toqy ?? profile?.plan_tier);
      setIsAgency(planTier === "agency");
      const rows = (biositesData ?? []) as BioSiteRow[];
      setSites(rows);
      const withDomain = rows.find((s) => s.custom_domain);
      setSelectedSlug((withDomain ?? rows[0])?.slug ?? "");
      setLoading(false);
    })();
    return () => { active = false; };
  }, [router]);

  const selectedSite = sites.find((s) => s.slug === selectedSlug) ?? null;

  useEffect(() => {
    if (selectedSite?.custom_domain) {
      setStatus({ domain: selectedSite.custom_domain, status: selectedSite.custom_domain_status });
    } else {
      setStatus(null);
    }
    setDomainInput("");
    setMessage(null);
  }, [selectedSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshStatus(slug: string) {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/domains?slug=${encodeURIComponent(slug)}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = (await res.json()) as DomainApiResponse;
      if (!res.ok) { setMessage(body.error || "Erro ao consultar domínio."); return; }
      setStatus(body);
      setSites((prev) => prev.map((s) => (s.slug === slug ? { ...s, custom_domain: body.domain, custom_domain_status: body.status } : s)));
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    if (!token || !selectedSlug || !domainInput.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: selectedSlug, domain: domainInput.trim() }),
      });
      const body = (await res.json()) as DomainApiResponse;
      if (!res.ok) { setMessage(body.error || "Erro ao adicionar domínio."); return; }
      setStatus(body);
      setSites((prev) => prev.map((s) => (s.slug === selectedSlug ? { ...s, custom_domain: body.domain, custom_domain_status: body.status } : s)));
      setDomainInput("");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!token || !selectedSlug) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: selectedSlug }),
      });
      const body = await res.json();
      if (!res.ok) { setMessage(body.error || "Erro ao remover domínio."); return; }
      setStatus(null);
      setSites((prev) => prev.map((s) => (s.slug === selectedSlug ? { ...s, custom_domain: null, custom_domain_status: null } : s)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Domínio próprio</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">Seu domínio, seu bio site</h1>
        <p className="mt-2 max-w-2xl text-muted">Aponte um domínio que já é seu (ex: meunegocio.com.br) direto pra um dos seus bio sites. Exclusivo do plano Agência.</p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm font-bold text-muted">Carregando...</p>
      ) : !isAgency ? (
        <div className="mt-7 rounded-[2rem] border border-violet/20 bg-violet/10 p-6">
          <p className="text-lg font-black text-ink">Disponível no plano Agência</p>
          <p className="mt-2 text-sm font-medium text-muted">Faça upgrade pra Agência pra conectar um domínio próprio a qualquer bio site que você criar.</p>
          <a href="/#planos" className="mt-4 inline-flex rounded-2xl bg-violet px-5 py-3 text-sm font-black text-white transition hover:opacity-90">Ver plano Agência</a>
        </div>
      ) : sites.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-bold text-muted">Crie um bio site primeiro pra poder conectar um domínio a ele.</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-5 lg:grid-cols-[280px_1fr]">
          <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm h-fit">
            <p className="text-sm font-black text-ink">Escolha o bio site</p>
            <div className="mt-3 space-y-2">
              {sites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSlug(site.slug)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${
                    selectedSlug === site.slug ? "border-accent bg-accent/10 text-accent-dim" : "border-border bg-surface text-ink hover:border-accent/40"
                  }`}
                >
                  <span className="truncate">{site.name || site.slug}</span>
                  {site.custom_domain ? <Globe className="h-4 w-4 shrink-0 opacity-60" /> : null}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="font-black text-ink">toqy.com.br/b/{selectedSlug}</p>

            {message ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{message}</p> : null}

            {status?.domain ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    {status.status === "verified" ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />}
                    <div>
                      <p className="font-black text-ink">{status.domain}</p>
                      <p className="text-xs font-bold text-muted">{status.status === "verified" ? "Conectado e servindo o bio site" : "Aguardando configuração do DNS"}</p>
                    </div>
                  </div>
                  <button onClick={() => refreshStatus(selectedSlug)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-black text-ink hover:border-accent disabled:opacity-40">
                    <RefreshCw className="h-3.5 w-3.5" /> Verificar
                  </button>
                </div>

                {status.status !== "verified" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-black">Configure o DNS no seu provedor de domínio</p>
                    <p className="mt-1 font-medium">Crie um registro CNAME (ou o tipo indicado abaixo) apontando <strong>{status.domain}</strong> para <strong>cname.vercel-dns.com</strong>. Pode levar até algumas horas pra propagar.</p>
                    {status.verification?.length ? (
                      <div className="mt-3 overflow-x-auto rounded-xl border border-amber-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead><tr className="border-b border-amber-100"><th className="p-2 font-black">Tipo</th><th className="p-2 font-black">Nome</th><th className="p-2 font-black">Valor</th></tr></thead>
                          <tbody>
                            {status.verification.map((v, i) => (
                              <tr key={i} className="border-b border-amber-50 last:border-0"><td className="p-2 font-mono">{v.type}</td><td className="p-2 font-mono">{v.domain}</td><td className="p-2 font-mono break-all">{v.value}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button onClick={handleRemove} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-black text-red-500 hover:bg-red-50 disabled:opacity-40">
                  <Trash2 className="h-4 w-4" /> Remover domínio
                </button>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="meunegocio.com.br"
                  className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent"
                />
                <button onClick={handleAdd} disabled={busy || !domainInput.trim()} className="rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white hover:bg-accent-dim disabled:opacity-40">
                  {busy ? "Conectando..." : "Conectar domínio"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
