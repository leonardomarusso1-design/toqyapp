"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { SiteBuilder } from "./SiteBuilder";
import type { ToqySite } from "@/lib/types";
import { getSiteBySlug, saveStoredSite, validateAccessKey } from "@/lib/siteStorage";

export function EditBioSiteClient({ slug }: { slug: string }) {
  const [site, setSite] = useState<ToqySite | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const found = getSiteBySlug(slug);
      setSite(found ? structuredClone(found) : null);
      setLoaded(true);
    });
  }, [slug]);

  function unlock() {
    if (!validateAccessKey(slug, accessKey)) {
      setError("Chave de acesso incorreta.");
      return;
    }
    setError("");
    setUnlocked(true);
  }

  if (!loaded) return <main className="min-h-screen bg-slate-50" />;

  if (!site) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Bio site nao encontrado</h1>
          <Link href="/me" className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Voltar</Link>
        </div>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-10 text-white">
        <section className="w-full max-w-[440px] rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Edicao do cliente</p>
          <h1 className="mt-2 text-3xl font-black">{site.profile.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">Digite a chave de acesso para editar este cartao digital.</p>
          <label className="mt-6 block">
            <span className="text-sm font-black text-slate-100">Chave de acesso</span>
            <input value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder="0000-0000" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" />
          </label>
          {error ? <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
          <button type="button" onClick={unlock} className="mt-5 w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">
            Liberar edicao
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SiteBuilder mode="edit" initialSite={site} onSave={saveStoredSite} />
      </div>
    </main>
  );
}
