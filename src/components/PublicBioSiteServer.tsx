// Server component wrapper — o PublicBioSite é client (usa hooks), então
// precisamos de um "use client" intermediário que recebe o site já carregado
"use client";

import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";

export function PublicBioSiteServer({ site }: { site: ToqySite }) {
  return <PublicBioSite site={site} />;
}
