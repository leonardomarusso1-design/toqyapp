"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import type { ToqySite } from "@/lib/types";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { supabase } from "@/lib/supabaseClient";

function EditPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const [site, setSite] = useState<ToqySite | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(async ({ slug }) => {
      // Busca site_data E edit_key_hash juntos
      const { data } = await supabase
        .from("toqy_biosites")
        .select("site_data, edit_key_hash")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) { setLoading(false); return; }

      const found = { ...(data.site_data as ToqySite), editKey: data.edit_key_hash };
      setSite(found);

      // Auto-unlock com chave da URL
      const keyFromUrl = (searchParams.get("key") ?? "").trim();
      if (keyFromUrl && data.edit_key_hash && keyFromUrl === data.edit_key_hash.trim()) {
        setKey(keyFromUrl);
        setUnlocked(true);
      }

      setLoading(false);
    });
  }, [params, searchParams]);

  async function verifyKey() {
    if (!site) return;
    const { data } = await supabase
      .from("toqy_biosites")
      .select("edit_key_hash")
      .eq("slug", site.slug)
      .maybeSingle();
    const validKey = data?.edit_key_hash ?? site.editKey;
    const valid = key.trim() === validKey?.trim();
    setUnlocked(valid);
    setError(valid ? "" : "Chave inválida. Confira a chave que você recebeu.");
  }

  async function handleSave(updated: ToqySite) {
    setSaving(true);
    try { await syncBiositeToSupabase(updated); setSite(updated); }
    finally { setSaving(false); }
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
