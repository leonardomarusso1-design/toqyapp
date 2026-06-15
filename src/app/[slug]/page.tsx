import StoredPublicBioSite from "@/components/StoredPublicBioSite";
import { getBiositeBySlug } from "@/lib/dataProvider";

export default async function PublicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPublicBioSite slug={slug} initialSite={getBiositeBySlug(slug) ?? undefined} />;
}
