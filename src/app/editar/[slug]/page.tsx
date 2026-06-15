"use client";

import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import type { ToqySite } from "@/lib/types";
import { getSiteBySlug, saveStoredSite } from "@/lib/siteStorage";

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const [site, setSite] = useState<ToqySite | null>(null);
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ slug }) => setSite(getSiteBySlug(slug) ?? null));
  }, [params]);

  function verifyKey() {
    if (!site) return;
    const valid = key.trim() === site.editKey.trim();
    setUnlocked(valid);
    setError(valid ? "" : "Chave inválida.");
  }

  if (!site) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black">Bio site não encontrado</h1>
          <p className="mt-2 text-sm text-slate-500">Confira o link de edição e tente novamente.</p>
        </div>
      </DashboardShell>
    );
  }

  if (!unlocked) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-7 text-center shadow-xl shadow-slate-200/70">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-[#31c4a8]">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Edição do cliente</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Editar {site.profile.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Digite a chave de acesso para liberar o editor visual deste bio site.</p>
          <input
            className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-4 text-center font-mono text-xl font-black outline-none transition focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
            value={key}
            onChange={(event) => {
              setKey(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") verifyKey();
            }}
            placeholder="0000-0000"
          />
          <button onClick={verifyKey} className="mt-4 w-full rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Entrar</button>
          {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
          <p className="mt-5 text-xs font-semibold text-slate-400">Demo: chave deste site e {site.editKey}</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <SiteBuilder mode="edit" initialSite={site} onSave={(updated) => {
        saveStoredSite(updated);
        setSite(updated);
      }} />
    </DashboardShell>
  );
}
