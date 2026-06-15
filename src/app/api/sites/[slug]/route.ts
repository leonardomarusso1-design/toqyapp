import { getBiositeBySlug } from "@/lib/dataProvider";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getBiositeBySlug(slug);

  if (!site) {
    return Response.json({ error: "Bio site nao encontrado", source: "dataProvider:local" }, { status: 404 });
  }

  return Response.json({ site, source: "dataProvider:local" });
}
