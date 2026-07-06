import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { SHOWCASE_SLUGS } from "@/lib/realTemplates";

export async function GET() {
  if (!hasSupabaseEnv()) return Response.json({ templates: [], debug: "no-env" });
  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ templates: [], debug: "no-client" });

  const { data, error, status, statusText } = await supabase
    .from("toqy_biosites")
    .select(
      "slug, segment:site_data->>segment, name:site_data->profile->>name, photo:site_data->profile->>profileImageUrl, logo:site_data->profile->>logoUrl, primary:site_data->theme->>primary, background:site_data->theme->>background, mode:site_data->theme->>mode"
    )
    .in("slug", SHOWCASE_SLUGS)
    .eq("status", "active");

  return Response.json({ count: data?.length ?? null, error, status, statusText });
}
