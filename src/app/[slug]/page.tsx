import StoredPublicBioSite from "@/components/StoredPublicBioSite";
import { getMockSiteBySlug } from "@/lib/mockSites";

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPublicBioSite slug={slug} initialSite={getMockSiteBySlug(slug) ?? undefined} />;
}
