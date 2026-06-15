import { createSiteFromSegmentTemplate } from "@/lib/segmentTemplates";
import type { Segment } from "@/lib/types";
import { generateSlug } from "@/lib/security";

type Body = {
  businessName?: string;
  segment?: Segment;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const businessName = body.businessName?.trim() || "Novo negócio";
  const site = createSiteFromSegmentTemplate(body.segment ?? "servicos", {
    slug: generateSlug(businessName),
    status: "active",
    profile: { name: businessName, description: "Bio site Toqy criado em modo mock.", location: "", logoSize: "medium", logoShape: "circle" },
  });

  return Response.json({
    site,
    slug: site.slug,
    public_url: `/b/${site.slug}`,
    edit_url: `/editar/${site.slug}`,
    edit_key: site.editKey,
    source: "mock",
  });
}
