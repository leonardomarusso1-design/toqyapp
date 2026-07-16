"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import type { ToqySite } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

function EditPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const [site, setSite] = useState<ToqySite | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fix de segurança real (2026-07-17, auditoria): o carregamento inicial
  // buscava site_data E edit_key_hash juntos, direto do navegador — a
  // chave de edição (texto puro, não é hash de verdade) chegava ao
  // cliente ANTES de qualquer verificação, só pra desenhar a tela de
  // "digite sua chave". Agora o load inicial busca só site_data (mesma
  // informação já pública na página pública do bio site, sem
  // edit_key_hash) e a verificação de chave — manual ou via ?key= na URL —
  // roda no servidor (POST /api/sites/[slug]/verify-key, service role).
  async function tryUnlock(slugValue: string, keyValue: string): Promise<boolean> {
    const res = await fetch(`/api/sites/${encodeURIComponent(slugValue)}/verify-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edit_key: keyValue }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.ok) {
      setSite(body.site as ToqySite);
      setUnlocked(true);
      return true;
    }
    return false;
  }

  useEffect(() => {
    params.then(async ({ slug }) => {
      const { data } = await supabase
        .from("toqy_biosites")
        .select("site_data, slug, status")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) { setLoading(false); return; }

      setSite({ ...(data.site_data as ToqySite), slug: data.slug, status: data.status });

      // Auto-unlock com chave da URL
      const keyFromUrl = (searchParams.get("key") ?? "").trim();
      if (keyFromUrl) {
        const ok = await tryUnlock(slug, keyFromUrl);
        if (ok) setKey(keyFromUrl);
      }

      setLoading(false);
    });
  }, [params, searchParams]);

  async function verifyKey() {
    if (!site) return;
    const valid = await tryUnlock(site.slug, key.trim());
    setError(valid ? "" : "Chave inválida. Confira a chave que você recebeu.");
  }

  async function handleSave(updated: ToqySite) {
    setSaving(true);
    try {
      // Tenta salvar via sessão primeiro
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Logado — salva normalmente via Supabase client
        const { syncBiositeToSupabase } = await import("@/lib/biositeSync");
        const result = await syncBiositeToSupabase(updated);
        if (!result.ok) throw new Error(result.error ?? "Erro ao salvar");
      } else {
        // Não logado — salva via API com chave de acesso (cliente externo)
        const res = await fetch("/api/biosite/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: updated, editKey: key }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      }

      setSite(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <ClientShell>
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#31c4a8] border-t-transparent" />
      </div>
    </ClientShell>
  );

  if (!site) return (
    <ClientShell>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black">Página não encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">Confira o link de edição e tente novamente.</p>
        <Link href="/me" className="mt-6 inline-flex rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">Área do cliente</Link>
      </div>
    </ClientShell>
  );

  if (!unlocked) return (
    <ClientShell>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-7 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-[#31c4a8]">
          <LockKeyhole className="h-8 w-8" />
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Editar minha página</p>
        <h1 className="mt-2 text-3xl font-black">{site.profile.name}</h1>
        <p className="mt-2 text-sm text-slate-500">Digite a chave de acesso que você recebeu.</p>
        <input
          className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-4 text-center font-mono text-xl font-black outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
          value={key} onChange={(e) => { setKey(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") verifyKey(); }}
          placeholder="1234-5678" inputMode="numeric"
        />
        <p className="mt-1 text-xs text-slate-400">Formato: 1234-5678 (com o traço no meio)</p>
        <button onClick={verifyKey} className="mt-4 w-full rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white hover:bg-[#25b69a]">Entrar</button>
        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      </div>
    </ClientShell>
  );

  return (
    <ClientShell fullWidth>
      <SiteBuilder mode="edit" initialSite={site} onSave={handleSave} />
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-2xl bg-white px-6 py-4 font-black text-slate-800 shadow-xl">Salvando...</div>
        </div>
      )}
    </ClientShell>
  );
}

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <EditPageInner params={params} />
    </Suspense>
  );
}
