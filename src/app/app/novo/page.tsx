"use client";
import { DashboardShell } from "@/components/DashboardShell";
import { SiteBuilder } from "@/components/SiteBuilder";
import { createSiteFromSegmentTemplate } from "@/lib/segmentTemplates";
import { createStoredSite } from "@/lib/siteStorage";
export default function NewBioSitePage() { const initialSite = createSiteFromSegmentTemplate("servicos", { profile: { name: "Novo negócio", title: "Cartão digital TOQY", description: "Atendimento, links e catálogo em uma página profissional.", location: "", logoSize: "medium", logoShape: "circle" }, slug: "novo-negocio" }); return <DashboardShell><SiteBuilder mode="create" initialSite={initialSite} onSave={createStoredSite} /></DashboardShell>; }
