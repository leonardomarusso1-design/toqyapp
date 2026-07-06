import { getTemplatePreviews } from "@/lib/realTemplates";

export async function GET() {
  const templates = await getTemplatePreviews();
  return Response.json({ templates });
}
