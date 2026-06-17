import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { mockSites } from "@/lib/mockSites";

export async function GET() {
  if (!hasSupabaseEnv()) return Response.json({ sites: mockSites, source: "mock" });
  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase.from("toqy_biosites").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const sites = (data ?? []).map((r) => ({ ...r.site_data, id: r.id, slug: r.slug, status: r.status }));
  return Response.json({ sites, source: "supabase" });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { site } = body as { site: Record<string, unknown> };
  if (!site?.slug) return Response.json({ error: "slug required" }, { status: 400 });
  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase.from("toqy_biosites").insert({ slug: site.slug as string, status: (site.status as string) ?? "active", edit_key_hash: site.editKey as string, site_data: site }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id, slug: data.slug, source: "supabase" });
}
