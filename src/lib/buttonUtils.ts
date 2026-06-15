import type { ToqyButton, ToqySite } from "./types";
import { ensureUrl, normalizeInstagram, normalizePhone } from "./security";

export function whatsappUrl(site: ToqySite) {
  const phone = normalizePhone(site.contact.whatsapp || site.contact.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(site.contact.whatsappMessage || "Ola! Vim pelo Toqy.")}`;
}

export function buttonHref(site: ToqySite, button: ToqyButton): string {
  switch (button.type) {
    case "whatsapp": return whatsappUrl(site);
    case "instagram": return normalizeInstagram(site.contact.instagram);
    case "facebook": return ensureUrl(site.contact.facebook);
    case "phone": return site.contact.phone ? `tel:${normalizePhone(site.contact.phone)}` : "";
    case "maps": return ensureUrl(site.links.googleMapsUrl);
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
      return ensureUrl(button.url);
    default: return "";
  }
}

export function wifiPayload(site: ToqySite) {
  const enc = site.wifi.encryption === "nopass" ? "nopass" : site.wifi.encryption;
  return `WIFI:T:${enc};S:${site.wifi.ssid};P:${site.wifi.password};H:false;;`;
}

export function pixPayload(site: ToqySite, amount?: number) {
  const value = amount ? ` | Valor: R$ ${amount.toFixed(2).replace(".", ",")}` : "";
  return `PIX ${site.pix.key || "chave-pix"} | ${site.pix.receiver || site.profile.name}${value}`;
}

export function createVCard(site: ToqySite) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${site.profile.name}`,
    `ORG:${site.profile.name}`,
    site.contact.phone ? `TEL:${site.contact.phone}` : "",
    site.contact.email ? `EMAIL:${site.contact.email}` : "",
    site.profile.location ? `ADR:;;${site.profile.location}` : "",
    site.contact.website ? `URL:${site.contact.website}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}
