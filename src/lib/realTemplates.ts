/**
 * Templates reais — biosites de verdade usados como vitrine na landing page e
 * como ponto de partida ("clonar") no criador de novos biosites.
 *
 * Somente leitura: nunca grava nada nos 12 biosites reais listados abaixo.
 */
import type { ToqyButton, ToqySite } from "./types";
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

/** Busca os biosites reais (batch único) para exibição — nunca escreve nada. */
export async function getShowcaseSites(): Promise<ToqySite[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("toqy_biosites")
    .select("site_data")
    .in("slug", SHOWCASE_SLUGS)
    .eq("status", "active");

  if (error || !data) return [];
  return data
    .map((row) => row.site_data as ToqySite | null)
    .filter((site): site is ToqySite => Boolean(site));
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
