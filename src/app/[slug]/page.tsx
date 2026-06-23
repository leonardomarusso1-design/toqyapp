import type { ToqySite } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { PublicBioSiteServer } from "@/components/PublicBioSiteServer";

async function getBiosite(slug: string): Promise<ToqySite | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("toqy_biosites")
    .select("site_data")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data?.site_data as ToqySite | null;
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Rotas do sistema — não são bio sites
  const reserved = ["app","login","me","editar","onboarding","obrigado","b","api","auth"];
  if (reserved.includes(slug)) return null;
  const site = await getBiosite(slug);
  if (!site) return null;
  return <PublicBioSiteServer site={site} />;
}

export const revalidate = 60;
