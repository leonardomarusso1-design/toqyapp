import type { ToqySite } from "./types";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function buildToqyWhatsappUrl(site: ToqySite): string {
  const phone = site.contact.whatsapp.replace(/\D/g, "");
  const message = encodeURIComponent(site.contact.whatsappMessage);
  return `https://wa.me/${phone}?text=${message}`;
}

export function buildToqyWifiQrValue(site: ToqySite): string {
  const { ssid, password, encryption } = site.wifi;
  const type = encryption === "nopass" ? "nopass" : encryption;
  const pass = password || "";
  return `WIFI:T:${type};S:${ssid};P:${pass};;`;
}

export function getSiteBackground(site: ToqySite): string {
  const { backgroundType, background, gradientFrom, gradientTo } = site.theme;
  const plaqueImage = site.plaqueTheme?.useSameBackground ? site.plaqueTheme.backgroundImageUrl : undefined;
  const backgroundImageUrl = plaqueImage || site.profile.backgroundImageUrl;

  if (backgroundType === "image" && backgroundImageUrl) {
    if (site.theme.useBackgroundOverlay) {
      return `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${backgroundImageUrl})`;
    }
    return `url(${backgroundImageUrl})`;
  }

  if (backgroundType === "gradient") {
    return `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`;
  }

  return background;
}

export function generateMockPixCode(site: ToqySite, amount: number): string {
  const receiver = site.pix.receiver || site.profile.name;
  const key = site.pix.key || "00000000000";
  return `00020126360014br.gov.bcb.pix0114${key}5204000053039865406${(amount * 100).toFixed(0).padStart(6, "0")}5802BR59${receiver.length.toString().padStart(2, "0")}${receiver}6009SAO PAULO62070503***63041234`;
}
