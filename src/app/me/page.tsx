"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Edit3, ExternalLink, LockKeyhole } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import type { ToqySite } from "@/lib/types";
import { createEditUrl, createPublicUrl } from "@/lib/dataProvider";
import { supabase } from "@/lib/supabaseClient";
import { generateSlug } from "@/lib/security";

export default function MePage() {
  const [username, setUsername] = useState("");
  const [key, setKey] = useState("");
  const [site, setSite] = useState<ToqySite | null>(null);
  const [unlockedKey, setUnlockedKey] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enter() {
    const cleanUser = username.trim().replace(/^https?:\/\/[^/]+/i, "").replace(/^\/b\//, "").replace(/^\//, "");
    if (!key.trim()) { setError("Digite a sua chave de acesso."); return; }

    setLoading(true);
    setError("");
    try {
      // Busca o bio site no Supabase pela chave + slug
      const slug = cleanUser ? generateSlug(cleanUser) : null;
      let query = supabase.from("toqy_biosites").select("site_data, slug, status, edit_key_hash");
      if (slug) query = query.eq("slug", slug);

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;

      const match = (data ?? []).find(row => row.edit_key_hash === key.trim());
      if (!match) {
        setError("Usuário ou chave incorretos. Confira os dados que o criador enviou para você.");
        setSite(null);
        return;
      }

      const found = { ...match.site_data, slug: match.slug, status: match.status } as ToqySite;
      setSite(found);
      setUnlockedKey(key.trim());
    } catch {
      setError("Erro ao verificar acesso. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
    <ClientShell action={site ? <button onClick={() => { setSite(null); setKey(""); setUsername(""); }} className="text-sm font-black text-muted transition hover:text-accent-dim">Sair</button> : <span />}>
      {!site ? (
        <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-black md:text-4xl">Acesse a sua página</h1>
          <p className="mt-3 text-muted">Use o usuário e a chave de acesso que você recebeu para abrir e editar a sua página.</p>

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-black text-ink">Usuário (o link da sua página)</span>
              <input
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(""); }}
                onKeyDown={(event) => event.key === "Enter" && enter()}
                className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                placeholder="nome-do-negocio"
              />
            </label>
            <label className="block">
              <span className="text-sm font-black text-ink">Chave de acesso</span>
              <p className="mt-0.5 text-xs text-muted">Formato: 1234-5678 (com o traço no meio)</p>
              <input
                value={key}
                onChange={(event) => { setKey(event.target.value); setError(""); }}
                onKeyDown={(event) => event.key === "Enter" && enter()}
                className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 font-mono text-lg font-black text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                placeholder="1234-5678"
                inputMode="numeric"
              />
            </label>
            <button onClick={enter} disabled={loading} className="rounded-2xl bg-accent px-5 py-3.5 font-black text-white transition hover:-translate-y-0.5 hover:bg-accent-dim disabled:opacity-60">{loading ? "Verificando..." : "Entrar"}</button>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Minha página</p>
                <h1 className="mt-1 text-3xl font-black">{site.profile.name}</h1>
                <p className="mt-1 text-sm text-muted">Acesso liberado. Você gerencia apenas a sua página.</p>
              </div>
              <Link href={`${createEditUrl(site.slug)}?key=${encodeURIComponent(unlockedKey)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-accent-dim">
                <Edit3 className="h-4 w-4" /> Editar minha página
              </Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[200px_1fr]">
              <div className="w-fit rounded-3xl border border-border bg-card p-4 shadow-sm">
                <QRCodeSVG value={publicUrl} size={170} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Link público</p>
                <p className="mt-2 break-all text-muted">{publicUrl}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-black text-ink">
                    <Copy className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}
                  </button>
                  <Link href={createPublicUrl(site.slug)} className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-black text-ink">Abrir <ExternalLink className="h-4 w-4" /></Link>
                </div>
                <p className="mt-5 text-xs font-semibold text-muted">Guarde a sua chave de acesso para entrar novamente: <span className="font-mono font-black text-ink">{site.editKey}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientShell>
  );
}
