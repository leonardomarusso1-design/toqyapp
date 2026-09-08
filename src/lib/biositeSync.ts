/**
 * biositeSync.ts
 * Salva bio sites no Supabase quando o usuário está logado.
 * Fallback para localStorage quando offline ou sem sessão.
 */
"use client";

import { supabase } from "./supabaseClient";
import { saveStoredSite } from "./siteStorage";
import type { ToqySite } from "./types";

// Escreve via /api/biosite/sync (servidor), não mais direto no Supabase
// pelo SDK do navegador (2026-09-08, achado numa auditoria de plano
// gratuito x pro pedida pelo Leonardo). Motivo: RLS de toqy_biosites só
// valida "é dono da linha" — não valida campos DENTRO do JSONB site_data.
// Escrevendo direto do cliente, nada impedia (fora da tela normal, via
// chamada manual à API do Supabase) setar site_data.ownerPlan pra um tier
// pago e, graças à trava-nunca-desce, ficar com esse nível pra sempre sem
// pagar. Agora o cálculo de ownerPlan só roda no servidor (ver
// resolveEffectiveOwnerPlan em subscriptions.ts, chamado pela rota) — o
// que for enviado aqui em site.ownerPlan é sempre ignorado lá.
export async function syncBiositeToSupabase(site: ToqySite): Promise<{ ok: boolean; source: "supabase" | "local"; error?: string }> {
  // Tenta refresh da sessão primeiro — evita erro de token expirado
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    // Tenta renovar a sessão
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }
  if (!session?.user) {
    saveStoredSite(site);
    return { ok: true, source: "local", error: "Sem sessão ativa — faça login novamente" };
  }

  try {
    const res = await fetch("/api/biosite/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ site }),
    });
    const data: { ok: boolean; ownerPlan?: string; error?: string } = await res.json();

    if (!res.ok || !data.ok) {
      console.error("[biositeSync] /api/biosite/sync error:", data.error);
      saveStoredSite(site);
      return { ok: false, source: "local", error: data.error };
    }

    saveStoredSite({ ...site, ownerPlan: data.ownerPlan });
    return { ok: true, source: "supabase" };

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[biositeSync] Catch error:", msg);
    saveStoredSite(site);
    return { ok: false, source: "local", error: msg };
  }
}

export async function loadBiositeFromSupabase(slug: string): Promise<ToqySite | null> {
  // Busca via /api/biosites/[slug] (2026-09-08, auditoria de segurança) —
  // antes esta função consultava toqy_biosites DIRETO do navegador com a
  // chave anon (a RLS pública de "status=active" permitia). Achado real:
  // isso devolvia site_data CRU, com a chave de edição em texto puro,
  // pro estado do React de /[slug]/pix (StoredPixHub) — inspecionável
  // pelo DevTools/aba de rede por qualquer visitante. A rota de servidor
  // já existe e já sanitiza (toPublicSite() remove editKey antes de
  // responder, ver /api/biosites/[slug]/route.ts) — mesmo caminho que
  // showcaseSiteCache.ts já usa pra vitrine da landing.
  try {
    const res = await fetch(`/api/biosites/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data: { site?: ToqySite } = await res.json();
    return data.site ?? null;
  } catch (err) {
    console.error("[biositeSync] loadBiosite catch:", err);
    return null;
  }
}

export async function listBiositesFromSupabase(): Promise<ToqySite[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data } = await supabase
      .from("toqy_biosites")
      .select("site_data, slug, status, created_at")
      .eq("owner_profile_id", session.user.id)
      .order("created_at", { ascending: false });

    return (data ?? []).map((r) => ({ ...r.site_data as ToqySite, slug: r.slug, status: r.status }));
  } catch {
    return [];
  }
}

export async function countBiositesInSupabase(userId: string): Promise<number> {
  const { count } = await supabase
    .from("toqy_biosites")
    .select("id", { count: "exact", head: true })
    .eq("owner_profile_id", userId);
  return count ?? 0;
}
