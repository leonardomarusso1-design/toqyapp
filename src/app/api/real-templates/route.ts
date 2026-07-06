import { getShowcaseSummaries } from "@/lib/realTemplates";

export async function GET() {
  const templates = await getShowcaseSummaries();
  return Response.json({ templates });
}
