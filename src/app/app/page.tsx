"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, Eye, MoreHorizontal, Plus, QrCode, Search } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import type { ToqySite } from "@/lib/types";
import { createEditUrl, createPublicUrl, mergeMockAndStoredSites } from "@/lib/siteStorage";

export default function DashboardPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [copied, setCopied] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => setSites(mergeMockAndStoredSites()), []);

  const filteredSites = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((site) => `${site.profile.name} ${site.slug} ${site.profile.title ?? ""}`.toLowerCase().includes(term));
  }, [query, sites]);

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Biosites</h1>
          <p className="mt-1 text-slate-500">{sites.length} biosites no total</p>
        </div>
        <Link href="/app/novo" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
          <Plus className="h-4 w-4" /> Novo biosite
        </Link>
      </div>

      <div className="mt-7 max-w-md">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar biosites..." className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
        </label>
      </div>

      <section className="mt-6 grid gap-4">
        {filteredSites.map((site, index) => {
          const publicLink = createPublicUrl(site.slug);
          const editLink = createEditUrl(site.slug);
          const views = site.status === "active" ? 183 + index * 32 : 0;
          return (
            <article key={site.id} className="rounded-[1.6rem] border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-xl font-black text-[#31c4a8]">
                    {site.profile.logoUrl ? <img src={site.profile.logoUrl} alt={site.profile.name} className="h-full w-full object-cover" /> : site.profile.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-black">{site.profile.name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${site.status === "active" ? "bg-emerald-50 text-[#1f9f87]" : "bg-slate-100 text-slate-500"}`}>{site.status === "active" ? "Publicado" : "Rascunho"}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">{publicLink} {site.profile.title ? `· ${site.profile.title}` : ""}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-slate-500"><Eye className="h-4 w-4" />{views}</span>
                  <button type="button" onClick={() => copy(publicLink, `${site.id}-link`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                    <Copy className="h-4 w-4" />{copied === `${site.id}-link` ? "Copiado" : "Link"}
                  </button>
                  <button type="button" onClick={() => copy(site.editKey, `${site.id}-key`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                    <Copy className="h-4 w-4" />{copied === `${site.id}-key` ? "Copiado" : "Chave"}
                  </button>
                  <Link href={`/app/qr?site=${site.slug}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]"><QrCode className="h-4 w-4" />QR</Link>
                  <Link href={editLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:border-[#31c4a8]"><Edit3 className="h-4 w-4" />Editar</Link>
                  <button type="button" className="rounded-2xl p-3 text-slate-500 hover:bg-slate-50"><MoreHorizontal className="h-5 w-5" /></button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </DashboardShell>
  );
}
