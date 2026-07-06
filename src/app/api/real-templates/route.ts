import { getShowcaseSites } from "@/lib/realTemplates";

export async function GET() {
  const templates = await getShowcaseSites();
  return Response.json({ templates });
}
