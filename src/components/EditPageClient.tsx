"use client";

import Link from "next/link";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import type { ToqySite } from "@/lib/types";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { supabase } from "@/lib/supabaseClient";

export function EditPageClient({ site: initialSite, slug, keyFromUrl }: {
  site: ToqySite | null;
  slug: string;
  keyFromUrl?: string;
}) {
  const [site] = useState(initialSite);
  const [key, setKey] = useState(keyFromUrl ?? "");
  const [unlocked, setUnlocked] = useState(() => {
    // Auto-unlock se chave vier na URL e bater com o editKey
    if (keyFromUrl && initialSite?.editKey) {
      return keyFromUrl.trim() === initialSite.editKey.trim();
    }
    return false;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function verifyKey() {
    if (!site) return;
    const { data } = await supabase
      .from("toqy_biosites")
      .select("edit_key_hash")
      .eq("slug", slug)
      .maybeSingle();
    const validKey = data?.edit_key_hash ?? site.editKey;
    const valid = key.trim() === validKey?.trim();
    setUnlocked(valid);
    setError(valid ? "" : "Chave inválida. Confira a chave que o criador enviou para você.");
  }

  async function handleSave(updated: ToqySite) {
    setSaving(true);
    try { await syncBiositeToSupabase(updated); }
    finally { setSaving(false); }
  }

  if (!site) return (
    <ClientShell>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black">Página não encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">Confira o link de edição e tente novamente.</p>
        <Link href="/me" className="mt-6 inline-flex rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">Ir para a área do cliente</Link>
      </div>
    </ClientShell>
  );

  if (!unlocked) return (
    <ClientShell>
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-7 text-center shadow-xl shadow-slate-200/70">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-[#31c4a8]">
          <LockKeyhole className="h-8 w-8" />
        </div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Editar minha página</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{site.profile.name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Digite a chave de acesso que você recebeu para liberar o editor.</p>
        <input
          className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-4 text-center font-mono text-xl font-black outline-none transition focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
          value={key} onChange={(e) => { setKey(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") verifyKey(); }}
          placeholder="1234-5678" inputMode="numeric"
        />
        <p className="mt-1 text-xs text-slate-400">Formato: 1234-5678 (com o traço no meio)</p>
        <button onClick={verifyKey} className="mt-4 w-full rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
          Entrar
        </button>
        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      </div>
    </ClientShell>
  );

  return (
    <ClientShell>
      <SiteBuilder mode="edit" initialSite={site} onSave={handleSave} />
      {saving && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="rounded-2xl bg-white px-6 py-4 font-black text-slate-800 shadow-xl">Salvando...</div></div>}
    </ClientShell>
  );
}
