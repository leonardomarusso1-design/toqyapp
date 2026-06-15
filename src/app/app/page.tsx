"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  Pause,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  deleteBiosite,
  duplicateBiosite,
  listBiosites,
  pauseBiosite,
  publishBiosite,
} from "@/lib/dataProvider";
import { createEditUrl, createPublicUrl } from "@/lib/siteStorage";
import type { ToqySite } from "@/lib/types";

const roleCards = [
  ["Admin", "Visão completa para Leonardo e equipe."],
  ["Aluno/revendedor", "Criação e gestão de clientes."],
  ["Cliente", "Edição simples por chave de acesso."],
] as const;

export default function DashboardPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [copied, setCopied] = useState("");
  const [query, setQuery] = useState("");

  function refresh() {
    setSites(listBiosites());
  }

  useEffect(() => refresh(), []);

  const filteredSites = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((site) => `${site.profile.name} ${site.slug} ${site.profile.title ?? ""}`.toLowerCase().includes(term));
  }, [query, sites]);

  const activeSites = sites.filter((site) => site.status === "active");
  const pixHubs = sites.filter((site) => site.modules.pixHub || site.pix.enabled);
  const mockClicks = activeSites.length * 183 + sites.length * 27;

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function runAndRefresh(action: () => unknown) {
    action();
    refresh();
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Painel Toqy</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Gestão de bio sites</h1>
          <p className="mt-2 max-w-2xl text-slate-500">Gerencie bio sites, QR Codes e NFCs dos seus clientes.</p>
        </div>
        <Link href="/app/novo" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
          <Plus className="h-4 w-4" /> Criar bio site
        </Link>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric title="Bio sites criados" value={sites.length} />
        <Metric title="QR/NFC ativos" value={activeSites.length} />
        <Metric title="Cliques mockados" value={mockClicks} />
        <Metric title="Clientes ativos" value={activeSites.length} />
        <Metric title="Pix Hubs ativos" value={pixHubs.length} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Bio sites recentes</h2>
              <p className="mt-1 text-sm text-slate-500">Links públicos, chaves, QR Codes e ações de gestão.</p>
            </div>
            <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:max-w-sm">
              <Search className="h-5 w-5 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar bio sites..." className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
            </label>
          </div>

          <div className="mt-5 grid gap-4">
            {filteredSites.map((site, index) => {
              const publicLink = createPublicUrl(site.slug);
              const editLink = createEditUrl(site.slug);
              const views = site.status === "active" ? 183 + index * 32 : 0;
              return (
                <article key={site.id} className="rounded-[1.5rem] border border-slate-100 bg-[#fbfdfc] p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-xl font-black text-[#31c4a8]">
                        {site.profile.logoUrl ? <img src={site.profile.logoUrl} alt={site.profile.name} className="h-full w-full object-cover" /> : site.profile.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black">{site.profile.name}</h3>
                          <StatusBadge status={site.status} />
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{site.profile.title || "Sem segmento"} · /b/{site.slug}</p>
                        <p className="mt-1 font-mono text-xs font-bold text-slate-400">Chave: {site.editKey}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-slate-500"><Eye className="h-4 w-4" />{views}</span>
                      <button type="button" onClick={() => copy(publicLink, `${site.id}-link`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                        <Copy className="h-4 w-4" />{copied === `${site.id}-link` ? "Copiado" : "Copiar link"}
                      </button>
                      <button type="button" onClick={() => copy(site.editKey, `${site.id}-key`)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                        <Copy className="h-4 w-4" />{copied === `${site.id}-key` ? "Copiado" : "Copiar chave"}
                      </button>
                      <Link href={`/app/qr?site=${site.slug}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]"><QrCode className="h-4 w-4" />Ver QR</Link>
                      <Link href={editLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:border-[#31c4a8]"><Edit3 className="h-4 w-4" />Editar</Link>
                      <Link href={publicLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]"><ExternalLink className="h-4 w-4" />Abrir</Link>
                      <button type="button" onClick={() => runAndRefresh(() => site.status === "active" ? pauseBiosite(site.id) : publishBiosite(site.id))} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                        <Pause className="h-4 w-4" />{site.status === "active" ? "Pausar" : "Publicar"}
                      </button>
                      <button type="button" onClick={() => runAndRefresh(() => duplicateBiosite(site.id))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">Duplicar</button>
                      <button type="button" onClick={() => runAndRefresh(() => deleteBiosite(site.id))} className="rounded-2xl border border-red-100 bg-white p-3 text-red-500 transition hover:bg-red-50" aria-label="Excluir bio site"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Ações rápidas</h2>
            <div className="mt-4 grid gap-3">
              <QuickAction href="/app/novo" icon={<Plus className="h-5 w-5" />} title="Criar bio site" />
              <QuickAction href="/app/qr" icon={<QrCode className="h-5 w-5" />} title="Gerar QR Code" />
              <QuickAction href={sites[0] ? createPublicUrl(sites[0].slug) : "/b/barbearia-andrian"} icon={<ExternalLink className="h-5 w-5" />} title="Ver página pública" />
              <QuickAction href={sites[0] ? createEditUrl(sites[0].slug) : "/editar/barbearia-andrian"} icon={<Edit3 className="h-5 w-5" />} title="Acessar editor do cliente" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31c4a8]/15 text-[#8df5df]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-black">Níveis futuros</h2>
            <div className="mt-4 grid gap-3">
              {roleCards.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-black">{title}</p>
                  <p className="mt-1 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <article className="rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <BarChart3 className="h-5 w-5 text-[#31c4a8]" />
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: ToqySite["status"] }) {
  const label = status === "active" ? "Ativo" : status === "disabled" ? "Pausado" : "Rascunho";
  const tone = status === "active" ? "bg-emerald-50 text-[#1f9f87]" : status === "disabled" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>{label}</span>;
}

function QuickAction({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-[#f8fbfa] p-4 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-[#31c4a8]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#31c4a8]">{icon}</span>
      {title}
    </Link>
  );
}
