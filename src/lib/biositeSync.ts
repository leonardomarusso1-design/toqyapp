/**
 * biositeSync.ts
 * Salva bio sites no Supabase quando o usuário está logado.
 * Fallback para localStorage quando offline ou sem sessão.
 */
"use client";

import { supabase } from "./supabaseClient";
import { saveStoredSite } from "./siteStorage";
import type { ToqySite } from "./types";

export async function syncBiositeToSupabase(site: ToqySite): Promise<{ ok: boolean; source: "supabase" | "local"; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    saveStoredSite(site);
    return { ok: true, source: "local", error: "Sem sessão ativa" };
  }

  // Busca o plano atual do dono para salvar junto ao site
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_toqy")
    .eq("id", session.user.id)
    .maybeSingle();

  const siteWithPlan = { ...site, ownerPlan: profile?.plan_toqy ?? "free" };

  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from("toqy_biosites")
      .select("id")
      .eq("slug", site.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("toqy_biosites")
        .update({
          site_data: siteWithPlan,
          status: site.status ?? "active",
          updated_at: new Date().toISOString(),
        })
        .eq("slug", site.slug)
        .eq("owner_profile_id", session.user.id);

      if (error) {
        console.error("[biositeSync] UPDATE error:", JSON.stringify(error));
        saveStoredSite(site);
        return { ok: false, source: "local", error: error.message || error.code };
      }
    } else {
      const { error } = await supabase
        .from("toqy_biosites")
        .insert({
          slug: site.slug,
          status: site.status ?? "active",
          edit_key_hash: site.editKey,
          owner_profile_id: session.user.id,
          site_data: siteWithPlan,
        });

      if (error) {
        console.error("[biositeSync] INSERT error:", JSON.stringify(error));
        saveStoredSite(site);
        return { ok: false, source: "local", error: error.message || error.code };
      }
    }

    saveStoredSite(siteWithPlan);
    return { ok: true, source: "supabase" };

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[biositeSync] Catch error:", msg);
    saveStoredSite(site);
    return { ok: false, source: "local", error: msg };
  }
}

export async function loadBiositeFromSupabase(slug: string): Promise<ToqySite | null> {
  try {
    // Busca pelo slug — a política RLS permite leitura pública de biosites com status=active
    const { data, error } = await supabase
      .from("toqy_biosites")
      .select("site_data")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[biositeSync] loadBiosite error:", error.message, error.code);
      return null;
    }
    if (data?.site_data) return data.site_data as ToqySite;
    return null;
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
