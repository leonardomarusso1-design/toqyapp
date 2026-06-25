import { Suspense } from "react";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import type { ToqySite } from "@/lib/types";
import { EditPageClient } from "@/components/EditPageClient";

async function getBiosite(slug: string): Promise<ToqySite | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("toqy_biosites")
    .select("site_data, edit_key_hash")
    .eq("slug", slug)
    .maybeSingle();
  if (!data?.site_data) return null;
  return { ...(data.site_data as ToqySite), editKey: data.edit_key_hash };
}

export default async function EditPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const site = await getBiosite(slug);

  return (
    <Suspense fallback={null}>
      <EditPageClient site={site} slug={slug} keyFromUrl={key} />
    </Suspense>
  );
}
