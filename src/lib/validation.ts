import type { ToqySite } from "./types";
import { isValidUrl } from "./security";

export function validateSite(site: ToqySite): { ok: true; errors: [] } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!site.profile.name.trim()) errors.push("Informe o nome do negócio.");
  if (!site.slug.trim()) errors.push("Informe o link da página.");
  if (site.contact.website && !isValidUrl(site.contact.website)) errors.push("O link do site não parece válido.");
  if (site.links.googleMapsUrl && !isValidUrl(site.links.googleMapsUrl)) errors.push("O link do Google Maps não parece válido.");
  if (site.pix.enabled && !site.pix.key.trim()) errors.push("Preencha a chave Pix ou desative o Pix.");
  if (site.wifi.enabled && !site.wifi.ssid.trim()) errors.push("Preencha o nome da rede Wi-Fi ou desative o Wi-Fi.");
  site.catalog.forEach((item) => { if (item.enabled && !item.name.trim()) errors.push("Existe item ativo no catálogo sem nome."); });
  return errors.length ? { ok: false, errors } : { ok: true, errors: [] };
}
