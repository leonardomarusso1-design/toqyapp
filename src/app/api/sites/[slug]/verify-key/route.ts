import { validateClientKey } from "@/lib/dataProvider";

type VerifyBody = { edit_key?: string };

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const ok = Boolean(validateClientKey(body.edit_key ?? "", slug));
  return Response.json({ ok, source: "dataProvider:local" }, { status: ok ? 200 : 401 });
}
