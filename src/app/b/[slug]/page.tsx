import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ToqySite } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { PublicBioSiteServer } from "@/components/PublicBioSiteServer";
import { toPublicSite } from "@/lib/publicSite";

async function getBiosite(slug: string): Promise<ToqySite | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("toqy_biosites")
    .select("site_data")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  // Remove a chave de edicao ANTES de qualquer coisa chegar ao
  // navegador (ver src/lib/publicSite.ts) — vulnerabilidade critica
  // corrigida em 2026-09-06.
  const site = data?.site_data as ToqySite | null;
  return site ? toPublicSite(site) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBiosite(slug);
  if (!site) return {};

  const title = site.profile.title ? `${site.profile.name} — ${site.profile.title}` : site.profile.name;
  const description = site.profile.description || `Página oficial de ${site.profile.name} no TOQY.`;
  const image = site.profile.profileImageUrl || site.profile.logoUrl;

  return {
    title,
    description,
    alternates: { canonical: `/b/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicBPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBiosite(slug);

  if (!site) notFound();

  return <PublicBioSiteServer site={site} />;
}

// Revalidar a cada 60 segundos para manter cache
export const revalidate = 60;
