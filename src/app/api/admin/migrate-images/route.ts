import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { uploadImageIfBase64 } from "@/lib/imageStorage";
import type { ToqySite } from "@/lib/types";

// Erros do Supabase (PostgrestError) são objetos simples { message, code,
// details, hint }, não instâncias de Error — String(err) neles vira
// "[object Object]" e esconde a causa real.
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
}

// Rota TEMPORÁRIA — migra biosites e avatares já existentes que salvaram
// imagem em base64 direto no banco (bug real corrigido em 2026-07-06, ver
// src/lib/imageStorage.ts) para links reais no Supabase Storage. Roda uma
// vez em produção (protegida por MIGRATION_SECRET) e é removida depois.
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const results: { slug: string; migrated: number; error?: string }[] = [];
  let biositesFetchError: string | null = null;

  // Bug real corrigido em 2026-07-06: buscar site_data (com base64 pesado)
  // de até 1000 linhas de uma vez estourava o statement timeout do Postgres
  // — mesma lição já aprendida em src/lib/realTemplates.ts. Primeiro busca
  // só id+slug (leve, nunca deveria travar), depois processa um biosite de
  // cada vez, buscando o site_data completo individualmente.
  const ids: { id: string; slug: string }[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data: rows, error } = await supabase
      .from("toqy_biosites")
      .select("id, slug")
      .range(from, from + PAGE - 1);
    if (error) biositesFetchError = error.message;
    if (error || !rows || rows.length === 0) break;
    ids.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }

  for (const { id, slug } of ids) {
    let migrated = 0;
    try {
      const { data: row, error: rowError } = await supabase
        .from("toqy_biosites")
        .select("site_data")
        .eq("id", id)
        .single();
      if (rowError || !row) throw rowError ?? new Error("linha não encontrada");
      const site = row.site_data as ToqySite;

      const nextProfile = { ...site.profile };
      for (const field of ["profileImageUrl", "logoUrl", "logoSignatureUrl", "backgroundImageUrl"] as const) {
        const before = nextProfile[field];
        const after = await uploadImageIfBase64(supabase, slug, field, before);
        if (after !== before) { nextProfile[field] = after; migrated++; }
      }

      let nextPlaqueTheme = site.plaqueTheme;
      if (nextPlaqueTheme?.backgroundImageUrl?.startsWith("data:image")) {
        const after = await uploadImageIfBase64(supabase, slug, "plaque-background", nextPlaqueTheme.backgroundImageUrl);
        nextPlaqueTheme = { ...nextPlaqueTheme, backgroundImageUrl: after };
        migrated++;
      }

      const nextCatalog = [];
      for (const item of site.catalog ?? []) {
        if (item.imageUrl?.startsWith("data:image")) {
          const after = await uploadImageIfBase64(supabase, slug, `catalog-${item.id}`, item.imageUrl);
          nextCatalog.push({ ...item, imageUrl: after });
          migrated++;
        } else {
          nextCatalog.push(item);
        }
      }

      if (migrated > 0) {
        const nextSite: ToqySite = { ...site, profile: nextProfile, plaqueTheme: nextPlaqueTheme, catalog: nextCatalog };
        const { error: updateError } = await supabase.from("toqy_biosites").update({ site_data: nextSite }).eq("id", id);
        if (updateError) throw updateError;
      }
      results.push({ slug, migrated });
    } catch (err) {
      results.push({ slug, migrated, error: errorMessage(err) });
    }
  }

  // Avatares de conta (profiles.avatar_url) — mesmo bug, tabela diferente.
  let profileFrom = 0;
  const profileResults: { id: string; migrated: boolean; error?: string }[] = [];
  while (true) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .range(profileFrom, profileFrom + PAGE - 1);
    if (error || !profiles || profiles.length === 0) break;

    for (const p of profiles) {
      if (!p.avatar_url?.startsWith("data:image")) continue;
      try {
        const url = await uploadImageIfBase64(supabase, p.id, "avatar", p.avatar_url);
        const { error: updateError } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", p.id);
        if (updateError) throw updateError;
        profileResults.push({ id: p.id, migrated: true });
      } catch (err) {
        profileResults.push({ id: p.id, migrated: false, error: errorMessage(err) });
      }
    }

    if (profiles.length < PAGE) break;
    profileFrom += PAGE;
  }

  return Response.json({
    biosites: {
      total: results.length,
      migrated: results.filter((r) => r.migrated > 0).length,
      errors: results.filter((r) => r.error),
      fetchError: biositesFetchError,
    },
    profiles: {
      migrated: profileResults.filter((r) => r.migrated).length,
      errors: profileResults.filter((r) => r.error),
    },
  });
}
