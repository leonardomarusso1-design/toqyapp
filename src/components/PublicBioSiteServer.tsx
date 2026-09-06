// Server component wrapper — o PublicBioSite é client (usa hooks), então
// precisamos de um "use client" intermediário que recebe o site já carregado
"use client";

import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";

export function PublicBioSiteServer({ site }: { site: ToqySite }) {
  // enableBackgroundMusic (2026-09-06, bug real reportado ao vivo: a
  // música de um bio site tocava sozinha na PÁGINA INICIAL do Toqy) — só
  // este wrapper, usado pelas rotas públicas de verdade (/b/[slug],
  // /[slug] via custom-domain), passa essa flag. Cards de exemplo na
  // landing (LandingBioSiteCard), o preview ao vivo do editor
  // (LiveBioSitePreview) e o preview mobile do SiteBuilder renderizam o
  // MESMO <PublicBioSite> sem essa flag — nunca tocam música sozinhos.
  return <PublicBioSite site={site} enableBackgroundMusic />;
}
