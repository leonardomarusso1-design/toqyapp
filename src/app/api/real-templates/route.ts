import { getTemplatePreviews } from "@/lib/realTemplates";

// Cache curto (Parte 4 da migração de imagens, 2026-07-06) — ver nota
// completa em src/app/api/biosites/[slug]/route.ts.
export async function GET() {
  const templates = await getTemplatePreviews();
  return Response.json({ templates }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
