import type { ToqyLinkType, ToqySite } from "./types";

const moduleByButtonType: Partial<Record<ToqyLinkType, keyof ToqySite["modules"]>> = {
  whatsapp: "whatsapp",
  instagram: "instagram",
  phone: "phone",
  maps: "maps",
  wifi: "wifi",
  pix: "pix",
  pixHub: "pixHub",
  review: "googleReview",
  booking: "booking",
  catalog: "catalog",
};

export function syncModulesFromButtons(site: ToqySite): ToqySite {
  const nextModules = { ...site.modules };
  Object.entries(moduleByButtonType).forEach(([type, moduleKey]) => {
    nextModules[moduleKey] = site.buttons.some((button) => button.type === type && button.enabled);
  });
  return { ...site, modules: nextModules };
}

export function defaultLabelForType(type: ToqyLinkType): string {
  const labels: Partial<Record<ToqyLinkType, string>> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    email: "E-mail",
    facebook: "Facebook",
    phone: "Telefone",
    maps: "Como chegar",
    wifi: "Wi-Fi",
    pix: "Pix",
    pixHub: "Pix Hub",
    catalog: "Catálogo",
    review: "Avaliação Google",
    booking: "Agendamento",
    website: "Site",
    menu: "Cardápio",
    youtube: "YouTube",
    tiktok: "TikTok",
    telegram: "Telegram",
    spotify: "Spotify",
    pdf: "PDF",
    drive: "Drive",
    image: "Imagem",
    event: "Evento",
    custom: "Novo botão",
  };
  return labels[type] ?? "Novo botão";
}

export const buttonTypeOptions: Array<{ type: ToqyLinkType; label: string; description: string }> = [
  { type: "whatsapp", label: "WhatsApp", description: "Abre conversa com mensagem pronta." },
  { type: "instagram", label: "Instagram", description: "Abre o perfil do Instagram." },
  { type: "linkedin", label: "LinkedIn", description: "Abre o perfil ou página do LinkedIn." },
  { type: "phone", label: "Telefone", description: "Liga para o estabelecimento." },
  { type: "maps", label: "Como chegar", description: "Abre o Google Maps." },
  { type: "wifi", label: "Wi-Fi", description: "Mostra rede, senha e QR Code." },
  { type: "pix", label: "Pix", description: "Abre o Pix inteligente com chave, QR Code e valores rápidos." },
  { type: "catalog", label: "Catálogo", description: "Rola até produtos e serviços." },
  { type: "review", label: "Avaliação Google", description: "Abre link de avaliação." },
  { type: "booking", label: "Agendamento", description: "Abre agenda externa." },
  { type: "website", label: "Site", description: "Abre o site oficial." },
  { type: "email", label: "E-mail", description: "Abre e-mail." },
  { type: "menu", label: "Cardápio", description: "Abre menu/cardápio." },
  { type: "youtube", label: "YouTube", description: "Abre canal ou vídeo." },
  { type: "tiktok", label: "TikTok", description: "Abre perfil ou vídeo." },
  { type: "telegram", label: "Telegram", description: "Abre conversa/canal." },
  { type: "spotify", label: "Spotify", description: "Abre playlist, perfil ou episódio." },
  { type: "pdf", label: "PDF", description: "Abre arquivo PDF." },
  { type: "drive", label: "Drive", description: "Abre pasta/arquivo." },
  { type: "image", label: "Imagem", description: "Abre uma imagem externa." },
  { type: "custom", label: "Link personalizado", description: "Abre qualquer link." },
];
