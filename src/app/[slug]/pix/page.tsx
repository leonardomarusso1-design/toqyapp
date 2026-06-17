import StoredPixHub from "@/components/StoredPixHub";

export default async function PixPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredPixHub slug={slug} />;
}
