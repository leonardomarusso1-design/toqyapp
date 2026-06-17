"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Edit3, ExternalLink, KeyRound, Plus, Search, Trash2, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { createEditUrl, createPublicUrl } from "@/lib/dataProvider";
import type { ToqySite } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { listBiositesFromSupabase } from "@/lib/biositeSync";

export default function ClientesPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");
  const [atLimit, setAtLimit] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadSites() {
    setOrigin(window.location.origin);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Busca APENAS bio sites reais do Supabase (sem mocks)
    const supabaseSites = await listBiositesFromSupabase();
    setSites(supabaseSites);

    // Checar limite
    const { data: profile } = await supabase.from("profiles").select("biosites_limit").eq("id", session.user.id).maybeSingle();
    const limit = profile?.biosites_limit ?? 1;
    setAtLimit(supabaseSites.length >= limit);
  }

  useEffect(() => { loadSites(); }, []);

  async function deleteSite(slug: string) {
    if (!window.confirm(`Excluir o bio site "${slug}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(slug);
    try {
      await supabase.from("toqy_biosites").delete().eq("slug", slug);
      setSites(prev => prev.filter(s => s.slug !== slug));
    } finally {
      setDeleting(null);
    }
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((s) => `${s.profile.name} ${s.slug}`.toLowerCase().includes(term));
  }, [query, sites]);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#31c4a8]">Clientes</p>
          <h1 className="mt-1 text-4xl font-black text-slate-950">Acessos dos clientes</h1>
          <p className="mt-1 text-sm text-slate-500">Entregue para cada cliente o usuário e a chave de acesso da página dele.</p>
        </div>
        <Link href="/app/novo" className="inline-flex items-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
          <Plus className="h-4 w-4" /> Novo cliente
        </Link>
      </div>

      <div className="mt-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-slate-700">
            <Users className="h-4 w-4 text-[#31c4a8]" />{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#31c4a8]" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-black text-slate-400">Nenhum bio site encontrado</p>
            <Link href="/app/novo" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">
              <Plus className="h-4 w-4" /> Criar primeiro bio site
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((site) => {
              const publicUrl = `${origin}${createPublicUrl(site.slug)}`;
              const editUrl = `${origin}${createEditUrl(site.slug)}`;
              const accessMsg = `Olá! Seu bio site TOQY está pronto 🎉\n\n📱 Acesse: ${publicUrl}\n\n✏️ Para editar:\n1. Acesse: https://toqy.com.br/me\n2. Slug: ${site.slug}\n3. Chave: ${site.editKey}`;
              return (
                <div key={site.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-lg font-black text-slate-400">
                      {site.profile.logoUrl ? <img src={site.profile.logoUrl} alt={site.profile.name} className="h-full w-full object-cover" /> : site.profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{site.profile.name}</p>
                      <p className="text-xs text-slate-400">Usuário: <span className="font-mono font-bold text-slate-600">{site.slug}</span></p>
                      <p className="text-xs text-slate-400"><KeyRound className="mr-1 inline h-3 w-3" /><span className="font-mono font-bold text-slate-600">{site.editKey}</span></p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => copy(accessMsg, `acesso-${site.id}`)} className="inline-flex items-center gap-2 rounded-2xl bg-[#31c4a8] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#25b69a]">
                      {copied === `acesso-${site.id}` ? "✓ Copiado" : "↗ Copiar acesso"}
                    </button>
                    <button onClick={() => copy(site.editKey, `chave-${site.id}`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-[#31c4a8]">
                      <Copy className="h-3.5 w-3.5" />{copied === `chave-${site.id}` ? "Copiada!" : "Copiar chave"}
                    </button>
                    <Link href={editUrl} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-slate-300">
                      <Edit3 className="h-3.5 w-3.5" />Editar
                    </Link>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-slate-300">
                      <ExternalLink className="h-3.5 w-3.5" />Abrir
                    </a>
                    <button onClick={() => deleteSite(site.slug)} disabled={deleting === site.slug} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" />{deleting === site.slug ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
