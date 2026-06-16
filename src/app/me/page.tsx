"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Edit3, ExternalLink, LockKeyhole } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import type { ToqySite } from "@/lib/types";
import { createEditUrl, createPublicUrl, validateClientKey } from "@/lib/dataProvider";

export default function MePage() {
  const [username, setUsername] = useState("");
  const [key, setKey] = useState("");
  const [site, setSite] = useState<ToqySite | null>(null);
  const [unlockedKey, setUnlockedKey] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function enter() {
    const cleanUser = username.trim().replace(/^https?:\/\/[^/]+/i, "").replace(/^\/b\//, "").replace(/^\//, "");
    if (!key.trim()) {
      setError("Digite a sua chave de acesso.");
      return;
    }
    const found = validateClientKey(key, cleanUser || undefined);
    if (!found) {
      setError("Usuário ou chave incorretos. Confira os dados que o criador enviou para você.");
      setSite(null);
      return;
    }
    setError("");
    setUnlockedKey(key.trim());
    setSite(found);
  }

  async function copyLink() {
    if (!site) return;
    const url = `${window.location.origin}${createPublicUrl(site.slug)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const publicUrl = site ? `${typeof window !== "undefined" ? window.location.origin : ""}${createPublicUrl(site.slug)}` : "";

  return (
    <ClientShell action={site ? <button onClick={() => { setSite(null); setKey(""); setUsername(""); }} className="text-sm font-black text-slate-600 transition hover:text-[#20b99d]">Sair</button> : <span />}>
      {!site ? (
        <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#31c4a8]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-black md:text-4xl">Acesse a sua página</h1>
          <p className="mt-3 text-slate-500">Use o usuário e a chave de acesso que você recebeu para abrir e editar a sua página.</p>

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-black text-slate-800">Usuário (o link da sua página)</span>
              <input
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(""); }}
                onKeyDown={(event) => event.key === "Enter" && enter()}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
                placeholder="ex.: barbearia-andrian"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black text-slate-800">Chave de acesso</span>
              <input
                value={key}
                onChange={(event) => { setKey(event.target.value); setError(""); }}
                onKeyDown={(event) => event.key === "Enter" && enter()}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-lg font-black text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
                placeholder="0000-0000"
                inputMode="numeric"
              />
            </label>
            <button onClick={enter} className="rounded-2xl bg-[#31c4a8] px-5 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Entrar</button>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Minha página</p>
                <h1 className="mt-1 text-3xl font-black">{site.profile.name}</h1>
                <p className="mt-1 text-sm text-slate-500">Acesso liberado. Você gerencia apenas a sua página.</p>
              </div>
              <Link href={`${createEditUrl(site.slug)}?key=${encodeURIComponent(unlockedKey)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-[#25b69a]">
                <Edit3 className="h-4 w-4" /> Editar minha página
              </Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[200px_1fr]">
              <div className="w-fit rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <QRCodeSVG value={publicUrl} size={170} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">Link público</p>
                <p className="mt-2 break-all text-slate-600">{publicUrl}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
                    <Copy className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}
                  </button>
                  <Link href={createPublicUrl(site.slug)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">Abrir <ExternalLink className="h-4 w-4" /></Link>
                </div>
                <p className="mt-5 text-xs font-semibold text-slate-400">Guarde a sua chave de acesso para entrar novamente: <span className="font-mono font-black text-slate-600">{site.editKey}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientShell>
  );
}
