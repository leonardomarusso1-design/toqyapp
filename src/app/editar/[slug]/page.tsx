"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { ClientShell } from "@/components/ClientShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import type { ToqySite } from "@/lib/types";
import { getBiositeBySlug, isDemoSlug, saveBiosite } from "@/lib/dataProvider";
import { supabase } from "@/lib/supabaseClient";

function EditPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const [site, setSite] = useState<ToqySite | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(async ({ slug }) => {
      // 1. Tentar buscar usando Supabase + Auth (RBAC)
      const { data: { session } } = await supabase.auth.getSession();
      
      let found: ToqySite | null = null;
      
      if (session) {
        // Busca com verificação de dono
        const { data: dbSite } = await supabase
          .from('biosites')
          .select('*')
          .eq('slug', slug)
          .eq('user_id', session.user.id)
          .single();
        if (dbSite) found = dbSite as ToqySite;
      }
      
      // 2. Se não achou (ou não logado), fallback para localProvider (ou chave)
      if (!found) {
        found = getBiositeBySlug(slug) ?? null;
      }

      setSite(found);
      setLoading(false);
      
      const keyFromUrl = (searchParams.get("key") ?? "").trim();
      if (found && keyFromUrl && keyFromUrl === found.editKey.trim()) {
        setKey(keyFromUrl);
        setUnlocked(true);
      }
    });
  }, [params, searchParams]);

  function verifyKey() {
    if (!site) return;
    const valid = key.trim() === site.editKey.trim();
    setUnlocked(valid);
    setError(valid ? "" : "Chave inválida. Confira a chave que o criador enviou para você.");
  }

  if (loading) {
    return (
      <ClientShell>
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-500">Carregando...</p>
        </div>
      </ClientShell>
    );
  }

  if (!site) {
    return (
      <ClientShell>
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-black">Página não encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">Confira o link de edição e tente novamente.</p>
          <Link href="/me" className="mt-6 inline-flex rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">Ir para a área do cliente</Link>
        </div>
      </ClientShell>
    );
  }

  if (!unlocked) {
    return (
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
            value={key}
            onChange={(event) => {
              setKey(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") verifyKey();
            }}
            placeholder="0000-0000"
            inputMode="numeric"
          />
          <button onClick={verifyKey} className="mt-4 w-full rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-[#25b69a]">Entrar</button>
          {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
          {/* Chave de acesso removida da UI pública para não expor */}
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell>
      <SiteBuilder mode="edit" initialSite={site} onSave={(updated) => {
        saveBiosite(updated);
        setSite(updated);
      }} />
    </ClientShell>
  );
}

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={null}>
      <EditPageInner params={params} />
    </Suspense>
  );
}
