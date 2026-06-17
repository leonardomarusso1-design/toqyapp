import StoredPixHub from "@/components/StoredPixHub";
import { getMockSiteBySlug } from "@/lib/mockSites";

export default async function PixPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPixHub slug={slug} initialSite={getMockSiteBySlug(slug) ?? undefined} />;
}
