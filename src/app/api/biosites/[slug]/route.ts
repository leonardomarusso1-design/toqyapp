import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { getMockSiteBySlug } from "@/lib/mockSites";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin()!;
    const { data, error } = await supabase.from("toqy_biosites").select("*").eq("slug", slug).single();
    if (!error && data) return Response.json({ site: { ...data.site_data, id: data.id, slug: data.slug, status: data.status }, source: "supabase" });
  }
  const site = getMockSiteBySlug(slug);
  if (!site) return Response.json({ error: "Bio site nao encontrado" }, { status: 404 });
  return Response.json({ site, source: "mock" });
}

export async function PATCH(request: Request, { params }: Params) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const { site, edit_key } = body as { site: Record<string, unknown>; edit_key?: string };
  if (!hasSupabaseEnv()) return Response.json({ ok: true, source: "mock" });
  const supabase = getSupabaseAdmin()!;
  const { data: existing } = await supabase.from("toqy_biosites").select("edit_key_hash").eq("slug", slug).single();
  if (existing && edit_key && existing.edit_key_hash !== edit_key) return Response.json({ error: "Chave invalida" }, { status: 401 });
  const { error } = await supabase.from("toqy_biosites").update({ site_data: site, status: (site?.status as string) ?? "active", updated_at: new Date().toISOString() }).eq("slug", slug);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, source: "supabase" });
}
