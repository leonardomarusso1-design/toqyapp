import { getMockSiteBySlug } from "@/lib/mockSites";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getMockSiteBySlug(slug);

  if (!site) {
    return Response.json({ error: "Bio site não encontrado", source: "mock" }, { status: 404 });
  }

  return Response.json({ site, source: "mock" });
}
