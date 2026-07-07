import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { generateEditKey } from "@/lib/security";

// Rota TEMPORÁRIA — rotaciona edit_key_hash de todos os biosites reais pra
// chaves fortes (bug de segurança corrigido em 2026-07-07, ver
// src/lib/security.ts:generateEditKey). Roda uma vez em produção (protegida
// por MIGRATION_SECRET) e é removida depois. Donos logados (owner_profile_id
// preenchido) veem a chave nova automaticamente no painel /app.
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const secret = request.headers.get("x-migration-secret");
  if (!secret || secret !== process.env.MIGRATION_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data: rows, error } = await supabase.from("toqy_biosites").select("id, slug");
  if (error || !rows) return Response.json({ error: error?.message ?? "erro ao listar biosites" }, { status: 500 });

  const results: { slug: string; ok: boolean; error?: string }[] = [];
  for (const row of rows) {
    const newKey = generateEditKey();
    const { error: updateError } = await supabase
      .from("toqy_biosites")
      .update({ edit_key_hash: newKey })
      .eq("id", row.id);
    results.push({ slug: row.slug, ok: !updateError, error: updateError?.message });
  }

  return Response.json({ total: results.length, rotated: results.filter((r) => r.ok).length, errors: results.filter((r) => !r.ok) });
}
