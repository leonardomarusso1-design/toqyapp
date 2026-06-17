import StoredPublicBioSite from "@/components/StoredPublicBioSite";

export default async function PublicBPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPublicBioSite slug={slug} />;
}
