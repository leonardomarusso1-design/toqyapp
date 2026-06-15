import StoredPublicBioSite from "@/components/StoredPublicBioSite";
import { getBiositeBySlug } from "@/lib/dataProvider";

export default async function PublicBPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPublicBioSite slug={slug} initialSite={getBiositeBySlug(slug) ?? undefined} />;
}
