"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, KeyRound, LockKeyhole } from "lucide-react";
import type { ToqySite } from "@/lib/types";
import { createEditUrl, createPublicUrl, validateClientKey } from "@/lib/dataProvider";

export default function MePage() {
  const [slug, setSlug] = useState("barbearia-andrian");
  const [key, setKey] = useState("");
  const [site, setSite] = useState<ToqySite | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function enter() {
    const cleanSlug = slug.replace(/^\/b\//, "").replace(/^\//, "");
    const found = validateClientKey(key, cleanSlug);
    if (!found) {
      setError("Chave inválida ou bio site não encontrado.");
      setSite(null);
      return;
    }
    setError("");
    setSite(found);
  }

  async function copyLink() {
    if (!site) return;
    const url = `${window.location.origin}${createPublicUrl(site.slug)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen bg-[#f6faf8] px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-black text-[#1f9f87]">← Voltar</Link>

        <section className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#31c4a8]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Área do cliente</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Acesse seu Toqy</h1>
          <p className="mt-3 max-w-2xl text-slate-500">Digite o slug do bio site e a chave de acesso entregue pelo criador.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <input value={slug} onChange={(event) => setSlug(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100" placeholder="barbearia-andrian" />
            <input value={key} onChange={(event) => setKey(event.target.value)} onKeyDown={(event) => event.key === "Enter" && enter()} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono font-black text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100" placeholder="8392-1147" />
            <button onClick={enter} className="rounded-2xl bg-[#31c4a8] px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Entrar</button>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
          <p className="mt-4 text-xs font-semibold text-slate-400">Demo: barbearia-andrian / 8392-1147</p>
        </section>

        {site ? (
          <section className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-2xl font-black">{site.profile.name}</p>
                <p className="mt-1 text-sm text-slate-500">Chave validada. Você está vendo apenas este bio site.</p>
              </div>
              <Link href={createEditUrl(site.slug)} className="rounded-2xl bg-[#31c4a8] px-5 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Editar bio site</Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="w-fit rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <QRCodeSVG value={`${window.location.origin}${createPublicUrl(site.slug)}`} size={190} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Link público</p>
                <p className="mt-2 break-all text-slate-600">{`${window.location.origin}${createPublicUrl(site.slug)}`}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
                    <Copy className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}
                  </button>
                  <Link href={createPublicUrl(site.slug)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">Abrir <ExternalLink className="h-4 w-4" /></Link>
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-[#1f9f87]"><KeyRound className="h-4 w-4" />{site.editKey}</span>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
