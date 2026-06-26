import { getSupabaseAdmin } from "@/lib/supabaseServer";
import type { ToqySite } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { site, editKey }: { site: ToqySite; editKey: string } = body;

    if (!site?.slug || !editKey) {
      return Response.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

    // Verificar chave de acesso
    const { data: existing } = await supabase
      .from("toqy_biosites")
      .select("id, edit_key_hash, owner_profile_id")
      .eq("slug", site.slug)
      .maybeSingle();

    if (!existing) return Response.json({ error: "Bio site não encontrado" }, { status: 404 });
    if (existing.edit_key_hash !== editKey.trim()) return Response.json({ error: "Chave inválida" }, { status: 403 });

    // Buscar plano do dono
    const { data: profile } = await supabase
      .from("profiles").select("plan_toqy").eq("id", existing.owner_profile_id).maybeSingle();

    const siteWithPlan = { ...site, ownerPlan: profile?.plan_toqy ?? "free" };

    const { error } = await supabase
      .from("toqy_biosites")
      .update({ site_data: siteWithPlan, name: siteWithPlan.profile.name, status: site.status ?? "active", updated_at: new Date().toISOString() })
      .eq("slug", site.slug);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
