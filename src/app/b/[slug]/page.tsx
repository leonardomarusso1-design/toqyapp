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

export default async function PublicBPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBiosite(slug);

  if (!site) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">TOQY</p>
        <h1 className="mt-3 text-3xl font-black">Bio site não encontrado</h1>
        <p className="mt-2 text-slate-400">Verifique o link ou crie um novo bio site.</p>
      </div>
    </main>
  );

  return <PublicBioSiteServer site={site} />;
}

// Revalidar a cada 60 segundos para manter cache
export const revalidate = 60;
