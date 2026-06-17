"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, ExternalLink, KeyRound, Plus, Search, Send, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { createEditUrl, createPublicUrl, listBiosites } from "@/lib/dataProvider";
import type { ToqySite } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

export default function ClientesPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    // Carrega só os bio sites do usuário logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? null;
      setSites(listBiosites(email));
    });
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((site) => `${site.profile.name} ${site.slug}`.toLowerCase().includes(term));
  }, [query, sites]);

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function accessMessage(site: ToqySite) {
    return [
      `Olá! A sua página TOQY está pronta. 🎉`,
      ``,
      `Página: ${origin}${createPublicUrl(site.slug)}`,
      ``,
      `Para editar quando quiser, acesse ${origin}/me e use:`,
      `Usuário: ${site.slug}`,
      `Chave de acesso: ${site.editKey}`,
    ].join("\n");
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Clientes</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Acessos dos clientes</h1>
          <p className="mt-2 max-w-2xl text-slate-500 font-medium">Entregue para cada cliente o usuário e a chave de acesso da página dele.</p>
        </div>
        <Link href="/app" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Novo cliente
        </Link>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Users className="h-5 w-5 text-indigo-600" /> {sites.length} {sites.length === 1 ? "cliente" : "clientes"}
          </div>
          <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 md:max-w-sm">
            <Search className="h-5 w-5 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente..." className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
          </label>
        </div>

        <div className="mt-5 grid gap-4">
          {filtered.map((site) => (
            <article key={site.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600">
                    {site.profile.logoUrl ? <img src={site.profile.logoUrl} alt={site.profile.name} className="h-full w-full object-cover" /> : site.profile.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-slate-900">{site.profile.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-md bg-slate-200 px-2.5 py-1">Usuário: {site.slug}</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-indigo-700"><KeyRound className="h-3.5 w-3.5" />{site.editKey}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copy(accessMessage(site), `msg-${site.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                    <Send className="h-4 w-4" />{copied === `msg-${site.id}` ? "Copiado" : "Copiar acesso"}
                  </button>
                  <button type="button" onClick={() => copy(site.editKey, `key-${site.id}`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Copy className="h-4 w-4" />{copied === `key-${site.id}` ? "Copiado" : "Copiar chave"}
                  </button>
                  <Link href={createEditUrl(site.slug)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Edit3 className="h-4 w-4" /> Editar
                  </Link>
                  <Link href={createPublicUrl(site.slug)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    Abrir <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="font-bold text-slate-700">Nenhum cliente encontrado.</p>
              <p className="mt-1 text-sm text-slate-500">Crie a primeira página para começar.</p>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
