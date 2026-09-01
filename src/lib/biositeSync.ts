/**
 * biositeSync.ts
 * Salva bio sites no Supabase quando o usuário está logado.
 * Fallback para localStorage quando offline ou sem sessão.
 */
"use client";

import { supabase } from "./supabaseClient";
import { saveStoredSite } from "./siteStorage";
import { isPremiumPlan, resolvePlanTier } from "./subscriptions";
import type { ToqySite } from "./types";

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

  // Busca o plano atual do dono para salvar junto ao site
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_toqy")
    .eq("id", session.user.id)
    .maybeSingle();

  const currentPlan = profile?.plan_toqy ?? "free";

  try {
    // Verifica se já existe (e busca o ownerPlan já gravado, se houver)
    const { data: existing } = await supabase
      .from("toqy_biosites")
      .select("id, site_data")
      .eq("slug", site.slug)
      .maybeSingle();

    // "Ownerplan trava-nunca-desce" (2026-09-01) — achado real: um bio site
    // criado por um revendedor Freelancer/Agência é pra um CLIENTE FINAL dele
    // (ex: uma barbearia), que não tem nada a ver com o revendedor atrasar o
    // pagamento. Antes desta mudança, TODO save regravava ownerPlan com o
    // plano ATUAL do dono — se o revendedor cancelasse e depois só corrigisse
    // um texto num bio site antigo, aquele save apagava Pix/Wi-Fi/Catálogo da
    // página pública do cliente final dele, sem o cliente final ter feito nada
    // de errado. Regra nova: uma vez que o bio site foi salvo com um plano
    // pago, ele mantém esse nível pra sempre (mesmo que o dono seja rebaixado
    // depois) — só o plano ATUAL do dono decide se dá pra CRIAR bio site novo
    // (ver checkBiositeLimit, que roda antes disso e é o bloqueio de verdade).
    const previousPlan = resolvePlanTier((existing?.site_data as ToqySite | undefined)?.ownerPlan);
    const effectivePlan = isPremiumPlan(resolvePlanTier(currentPlan)) ? currentPlan : (isPremiumPlan(previousPlan) ? previousPlan : currentPlan);
    const siteWithPlan = { ...site, ownerPlan: effectivePlan };

    if (existing) {
      const { error } = await supabase
        .from("toqy_biosites")
        .update({
          site_data: siteWithPlan,
          name: siteWithPlan.profile.name,
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
          name: siteWithPlan.profile.name,
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
