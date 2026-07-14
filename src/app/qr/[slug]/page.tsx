import StoredQrHub from "@/components/StoredQrHub";

export default async function QrCodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StoredQrHub slug={slug} />;
}
