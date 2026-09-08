"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorShell } from "@/components/EditorShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import { createSiteFromSegmentTemplate } from "@/lib/segmentTemplates";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { generateSlug } from "@/lib/security";
import type { ToqySite } from "@/lib/types";

export default function NewBioSitePage() {
  const router = useRouter();
  // catalog: [] (2026-09-08, bug real reportado ao vivo: "abro o catálogo
  // o card já está gigante aberto na tela") — o modelo "servicos" vem com
  // 3 itens de exemplo pré-preenchidos (nome, preço e imagem genéricos),
  // pensados pra quem escolhe esse modelo através do CATÁLOGO de modelos
  // antigo. Quem cria um bio site do zero aqui não pediu esses 3 itens
  // falsos — via RealTemplateGallery (etapa Modelo, "escolha um biosite
  // real") já dá pra clonar um catálogo de verdade quando quiser um
  // ponto de partida populado. Começar vazio bate com o pedido de "tudo
  // desativado, ir ativando aos poucos" pra quem está criando do zero.
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
    catalog: [],
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
    <EditorShell>
      <SiteBuilder mode="create" initialSite={initialSite} onSave={handleSave} />
    </EditorShell>
  );
}
