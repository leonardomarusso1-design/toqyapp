import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ToqySite } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { PublicBioSiteServer } from "@/components/PublicBioSiteServer";

/**
 * Rota interna (nunca acessada por /custom-domain de verdade, só via o
 * rewrite do middleware quando o Host header não é toqy.com.br) — resolve
 * qual bio site servir a partir do domínio próprio do cliente Agência.
 * Ver src/middleware.ts e src/app/api/domains/route.ts.
 */
async function getHost(): Promise<string> {
  const h = await headers();
  // Remove porta, se houver (ex: domínio.com:443 em alguns proxies) — o
  // valor gravado em custom_domain nunca tem porta (ver isValidCustomDomain).
  return (h.get('host') || '').toLowerCase().replace(/:\d+$/, '');
}

async function getBiositeByDomain(domain: string): Promise<ToqySite | null> {
  if (!domain) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("toqy_biosites")
    .select("site_data")
    .eq("custom_domain", domain)
    .eq("custom_domain_status", "verified")
    .eq("status", "active")
    .maybeSingle();
  return data?.site_data as ToqySite | null;
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await getHost();
  const site = await getBiositeByDomain(host);
  if (!site) return {};

  const title = site.profile.title ? `${site.profile.name} — ${site.profile.title}` : site.profile.name;
  const description = site.profile.description || `Página oficial de ${site.profile.name}.`;
  const image = site.profile.profileImageUrl || site.profile.logoUrl;

  return {
    title,
    description,
    alternates: { canonical: `https://${host}` },
    openGraph: { title, description, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function CustomDomainPage() {
  const host = await getHost();
  const site = await getBiositeByDomain(host);
  if (!site) notFound();
  return <PublicBioSiteServer site={site} />;
}

export const revalidate = 60;
