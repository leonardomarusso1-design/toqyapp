import StoredPixHub from "@/components/StoredPixHub";
import { getBiositeBySlug } from "@/lib/dataProvider";

export default async function PixPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPixHub slug={slug} initialSite={getBiositeBySlug(slug) ?? undefined} />;
}
