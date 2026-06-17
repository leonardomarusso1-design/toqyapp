import StoredPublicBioSite from "@/components/StoredPublicBioSite";
import { getMockSiteBySlug } from "@/lib/mockSites";

export default async function PublicBPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Mocks são sempre visíveis publicamente (bio sites de demonstração)
  return <StoredPublicBioSite slug={slug} initialSite={getMockSiteBySlug(slug) ?? undefined} />;
}
