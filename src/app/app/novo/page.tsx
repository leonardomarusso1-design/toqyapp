"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import { createSiteFromSegmentTemplate } from "@/lib/segmentTemplates";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { generateSlug } from "@/lib/security";
import type { ToqySite } from "@/lib/types";

export default function NewBioSitePage() {
  const router = useRouter();
  const [initialSite] = useState(() => createSiteFromSegmentTemplate("servicos", {
    profile: {
      name: "Novo negócio",
      title: "Cartão digital TOQY",
      description: "Atendimento, links e catálogo em uma página profissional.",
      location: "",
      logoSize: "medium",
      logoShape: "circle",
    },
    slug: "novo-negocio",
  }));

  async function handleSave(site: ToqySite) {
    // Garante slug normalizado antes de salvar
    const finalSite = { ...site, slug: generateSlug(site.slug || site.profile.name) };
    const result = await syncBiositeToSupabase(finalSite);
    if (result.source === "supabase") {
      // Bio site salvo com sucesso no Supabase
      router.refresh();
    }
  }

  return (
    <DashboardShell>
      <SiteBuilder mode="create" initialSite={initialSite} onSave={handleSave} />
    </DashboardShell>
  );
}
