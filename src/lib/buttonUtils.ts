import type { ToqyButton, ToqySite } from "./types";
import { ensureUrl, normalizeInstagram, normalizePhone } from "./security";
import { extractCityFromLocation, generatePixBRCode } from "./pixBrCode";

export function whatsappUrl(site: ToqySite) {
  const phone = normalizePhone(site.contact.whatsapp || site.contact.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(site.contact.whatsappMessage || "Olá! Vim pelo Toqy.")}`;
}

// "Como chegar" com mapa embutido (2026-09-08, pedido real com print de
// referência — "seria legal ao clicar, pra abrir aparecer mais ou menos
// igual tá na imagem, e a opção de Google Maps ou Waze"). Endereço em
// texto livre (site.profile.location) é a fonte pro mapa e pro Waze —
// não exige que o dono tenha colado um link do Google Maps pra
// funcionar, só o endereço que ele já preenche em Identidade.
export function mapsQuery(site: ToqySite): string {
  return (site.profile.location || site.profile.name || "").trim();
}

// Embed do Google Maps SEM chave de API (2026-09-08) — o projeto não tem
// Google Maps API key configurada, e conseguir uma (Google Cloud,
// billing, restrição de domínio) é escopo maior que "botão como chegar".
// `maps.google.com/maps?q=...&output=embed` é o truque de mercado pra
// embutir um mapa clicável com pino a partir só de um endereço em texto,
// sem chave nenhuma — estável há anos, usado por incontáveis sites.
export function mapsEmbedUrl(site: ToqySite): string {
  const q = mapsQuery(site);
  if (!q) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

// Abrir no Google Maps de verdade (app no celular, site no desktop).
// Respeita um link customizado do dono (site.links.googleMapsUrl —
// útil pra apontar pra uma FICHA específica do Google, não só o
// endereço) quando existir; senão gera a partir do endereço.
export function googleMapsExternalUrl(site: ToqySite): string {
  if (site.links.googleMapsUrl) return ensureUrl(site.links.googleMapsUrl);
  const q = mapsQuery(site);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
}

// Waze (2026-09-08, pedido real) — link universal oficial do Waze
// (waze.com/ul), abre o app no celular e o site no desktop, sem chave de
// API. Sempre a partir do endereço — diferente do Maps, não tem campo
// próprio pra link customizado (ninguém tem "ficha" no Waze pra apontar).
export function wazeExternalUrl(site: ToqySite): string {
  const q = mapsQuery(site);
  return q ? `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes` : "";
}

export function buttonHref(site: ToqySite, button: ToqyButton): string {
  switch (button.type) {
    case "whatsapp": return whatsappUrl(site);
    case "instagram": return normalizeInstagram(site.contact.instagram);
    case "facebook": return ensureUrl(site.contact.facebook);
    case "phone": return site.contact.phone ? `tel:${normalizePhone(site.contact.phone)}` : "";
    case "maps": return googleMapsExternalUrl(site);
    case "review": return ensureUrl(site.links.googleReviewUrl);
    case "booking": return ensureUrl(site.links.bookingUrl);
    case "website": return ensureUrl(site.contact.website);
    case "email": return site.contact.email ? `mailto:${site.contact.email}` : "";
    case "menu": return ensureUrl(site.links.menuUrl);
    case "youtube":
    case "tiktok":
    case "telegram":
    case "pdf":
    case "drive":
    case "image":
    case "event":
    case "custom":
    case "linkedin":
    case "spotify":
    case "twitter":
    case "pinterest":
    case "threads":
    case "ifood":
    case "waze":
    case "picpay":
    case "mercadopago":
    case "behance":
      return ensureUrl(button.url);
    default: return "";
  }
}

export function wifiPayload(site: ToqySite) {
  const enc = site.wifi.encryption === "nopass" ? "nopass" : site.wifi.encryption;
  const password = enc === "nopass" ? "" : site.wifi.password;
  return `WIFI:T:${enc};S:${site.wifi.ssid};P:${password};H:false;;`;
}

// Bug real corrigido em 2026-07-13 (Leonardo): isto retornava um texto
// solto ("PIX chave | recebedor"), NÃO um Pix de verdade — nenhum app de
// banco reconhece esse formato, o QR Code parecia funcionar mas não pagava
// nada. Agora gera o BR Code EMV real (padrão oficial do Banco Central),
// usado tanto no QR Code quanto no botão "Copiar código Pix" (Pix Copia e
// Cola) — os dois precisam ser o MESMO valor, é assim que o recurso
// funciona de verdade.
export function pixPayload(site: ToqySite, amount?: number) {
  return generatePixBRCode({
    key: site.pix.key || "",
    merchantName: site.pix.receiver || site.profile.name,
    city: extractCityFromLocation(site.profile.location || ""),
    amount,
  });
}

export function createVCard(site: ToqySite) {
  const whatsapp = site.contact.whatsapp?.replace(/\D/g, "");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${site.profile.name}`,
    `ORG:${site.profile.name}`,
    site.profile.title ? `TITLE:${site.profile.title}` : "",
    // Telefones
    site.contact.phone ? `TEL;TYPE=WORK,VOICE:${site.contact.phone}` : "",
    whatsapp ? `TEL;TYPE=CELL:+${whatsapp}` : "",
    // Email
    site.contact.email ? `EMAIL:${site.contact.email}` : "",
    // Endereço
    site.profile.location ? `ADR:;;${site.profile.location}` : "",
    // URLs — site, bio site TOQY, redes sociais
    site.contact.website ? `URL;TYPE=Site:${site.contact.website}` : "",
    site.contact.instagram ? `URL;TYPE=Instagram:${site.contact.instagram}` : "",
    site.contact.facebook ? `URL;TYPE=Facebook:${site.contact.facebook}` : "",
    whatsapp ? `URL;TYPE=WhatsApp:https://wa.me/${whatsapp}` : "",
    // Nota com descrição do negócio
    site.profile.description ? `NOTE:${site.profile.description}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}
