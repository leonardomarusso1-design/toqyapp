/**
 * biositeSync.ts
 * Salva bio sites no Supabase quando o usuário está logado.
 * Fallback para localStorage quando offline ou sem sessão.
 */
"use client";

import { supabase } from "./supabaseClient";
import { saveStoredSite } from "./siteStorage";
import type { ToqySite } from "./types";

export async function syncBiositeToSupabase(site: ToqySite): Promise<{ ok: boolean; source: "supabase" | "local" }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      saveStoredSite(site);
      return { ok: true, source: "local" };
    }

    // Verifica se já existe no Supabase
    const { data: existing } = await supabase
      .from("toqy_biosites")
      .select("id")
      .eq("slug", site.slug)
      .maybeSingle();

    if (existing) {
      // Update
      const { error } = await supabase
        .from("toqy_biosites")
        .update({
          site_data: site,
          status: site.status ?? "active",
          updated_at: new Date().toISOString(),
        })
        .eq("slug", site.slug);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from("toqy_biosites")
        .insert({
          slug: site.slug,
          status: site.status ?? "active",
          edit_key_hash: site.editKey,
          owner_profile_id: session.user.id,
          site_data: site,
        });

      if (error) throw error;
    }

    // Também salva no localStorage como cache local
    saveStoredSite(site);
    return { ok: true, source: "supabase" };

  } catch (err) {
    console.error("[biositeSync] Erro ao salvar no Supabase, salvando local:", err);
    saveStoredSite(site);
    return { ok: true, source: "local" };
  }
}

export async function loadBiositeFromSupabase(slug: string): Promise<ToqySite | null> {
  try {
    const { data } = await supabase
      .from("toqy_biosites")
      .select("site_data")
      .eq("slug", slug)
      .maybeSingle();

    if (data?.site_data) return data.site_data as ToqySite;
    return null;
  } catch {
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
