import { getMockSiteBySlug } from "@/lib/mockSites";

type VerifyBody = { edit_key?: string };

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const site = getMockSiteBySlug(slug);
  const ok = Boolean(site && body.edit_key?.trim() === site.editKey);
  return Response.json({ ok, source: "mock" }, { status: ok ? 200 : 401 });
}
