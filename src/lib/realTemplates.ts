/**
 * Templates reais — biosites de verdade usados como vitrine na landing page e
 * como ponto de partida ("clonar") no criador de novos biosites.
 *
 * Somente leitura: nunca grava nada nos 12 biosites reais listados abaixo.
 */
import type { Segment, ToqyButton, ToqySite } from "./types";
import { getSupabaseAdmin, hasSupabaseEnv } from "./supabaseServer";
import { generateEditKey, generateId, generateSlug } from "./security";

export const SHOWCASE_SLUGS = [
  "yakisabor",
  "barbearia-andrian",
  "drathaishassum",
  "cm-solucoes-consultoria",
  "biostudios",
  "viih-trancista",
  "do-japa",
  "amanda-servicos",
  "danrleyphonemaker",
  "dra-camila-torres",
  "dra-ana-clara-souza",
  "studio-jessica-fernanda",
] as const;

export type ShowcaseSummary = { slug: string; segment: Segment };

/**
 * Busca só slug+segmento (leve) — usado pela landing page pra montar os
 * grupos por categoria sem embutir os 12 site_data completos (com imagens em
 * base64) na página estática. Cada card busca o próprio conteúdo completo
 * depois, no navegador (ver LandingBioSiteCard).
 */
export async function getShowcaseSummaries(): Promise<ShowcaseSummary[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("toqy_biosites")
    .select("slug, segment:site_data->>segment")
    .in("slug", SHOWCASE_SLUGS)
    .eq("status", "active");

  if (error || !data) return [];
  return data
    .filter((row): row is { slug: string; segment: string } => Boolean(row.slug && row.segment))
    .map((row) => ({ slug: row.slug, segment: row.segment as Segment }));
}

const BATCH_SIZE = 3;

async function fetchBySlug(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  slug: string
): Promise<ToqySite | null> {
  const { data, error } = await supabase
    .from("toqy_biosites")
    .select("site_data")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) return null;
  return (data?.site_data as ToqySite | undefined) ?? null;
}

/**
 * Busca os biosites reais completos (com imagens) — usado pela galeria de
 * templates do editor via /api/real-templates (rota dinâmica, não faz parte
 * da página estática, então não tem o limite de tamanho de página do ISR).
 *
 * Uma query única com `.in(slug, [...12 valores])` estoura o statement
 * timeout do Postgres (alguns desses biosites têm imagens em base64
 * embutidas no JSONB `site_data`, então buscar os 12 de uma vez fica pesado
 * demais). Buscar os 12 em paralelo de uma vez também sobrecarrega — os mais
 * pesados individualmente ainda estouram o timeout sob concorrência alta.
 * Em vez disso, busca em lotes pequenos (sequenciais entre lotes, paralelo
 * dentro do lote) e tenta de novo uma vez os que falharem no primeiro passo.
 */
export async function getShowcaseSites(): Promise<ToqySite[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const bySlug = new Map<string, ToqySite | null>();

  for (let i = 0; i < SHOWCASE_SLUGS.length; i += BATCH_SIZE) {
    const batch = SHOWCASE_SLUGS.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((slug) => fetchBySlug(supabase, slug)));
    batch.forEach((slug, index) => bySlug.set(slug, results[index]));
  }

  // Segunda tentativa (sequencial, sem concorrência) só para quem falhou
  for (const [slug, site] of bySlug) {
    if (!site) bySlug.set(slug, await fetchBySlug(supabase, slug));
  }

  return SHOWCASE_SLUGS.map((slug) => bySlug.get(slug)).filter((site): site is ToqySite => Boolean(site));
}

/** Busca UM biosite real completo por slug — usado por cada card da landing, no navegador. */
export async function getShowcaseSiteBySlug(slug: string): Promise<ToqySite | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  return fetchBySlug(supabase, slug);
}

// Tipos de botão cujo `url` é um valor literal próprio do dono original (não
// derivado de contact/links em tempo de render — ver src/lib/buttonUtils.ts).
// Precisam ser apagados ao clonar; os demais tipos (whatsapp/instagram/maps/
// review/booking/email/menu/phone/website/facebook) recalculam a URL a partir
// de contact/links, que já são zerados abaixo — não precisam de tratamento extra.
const LITERAL_URL_BUTTON_TYPES = new Set<ToqyButton["type"]>([
  "custom",
  "pdf",
  "drive",
  "image",
  "event",
  "youtube",
  "tiktok",
  "telegram",
  "linkedin",
  "spotify",
]);

/**
 * Clona um biosite real como ponto de partida para um novo biosite. Mantém o
 * "design" (tema, botões, catálogo, layout, módulos) e apaga tudo que é
 * específico do dono original (identidade, contato, chaves, segredos).
 */
export function cloneRealTemplate(source: ToqySite, overrides: { name: string }): ToqySite {
  const now = new Date().toISOString();
  const name = overrides.name || "Novo negócio";

  return {
    ...source,
    id: generateId("site"),
    slug: generateSlug(name),
    status: "draft",
    editKey: generateEditKey(),
    createdAt: now,
    updatedAt: now,
    userId: undefined,
    profile: {
      ...source.profile,
      name,
      title: "",
      description: "",
      location: "",
      profileImageUrl: "",
      logoUrl: "",
      logoSignatureUrl: "",
      backgroundImageUrl: "",
    },
    contact: {
      phone: "",
      whatsapp: "",
      whatsappMessage: "Olá! Vim pelo QR Code e gostaria de mais informações.",
      instagram: "",
      facebook: "",
      email: "",
      website: "",
    },
    links: { googleMapsUrl: "", googleReviewUrl: "", bookingUrl: "", menuUrl: "" },
    pix: { ...source.pix, key: "", receiver: "", bank: "", whatsappProofNumber: "" },
    wifi: { ...source.wifi, ssid: "", password: "" },
    plaqueTheme: source.plaqueTheme ? { ...source.plaqueTheme, useSameBackground: false, backgroundImageUrl: "" } : undefined,
    buttons: source.buttons.map((button) => ({
      ...button,
      id: generateId("btn"),
      url: LITERAL_URL_BUTTON_TYPES.has(button.type) ? "" : button.url,
    })),
    catalog: source.catalog.map((item) => ({ ...item, id: generateId("prd") })),
  };
}
