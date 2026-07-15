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
  // Bug real corrigido (2026-07-16): esta regra exigia nome em TODO item
  // ativo, de antes do catálogo permitir itens "só foto" (nome/descrição
  // vazios de propósito — ver BulkCatalogPhotoAdd/SiteBuilder). Passou a
  // bloquear o Salvar de qualquer site com fotos avulsas no catálogo.
  // Agora só exige nome OU imagem — item sem nenhum dos dois é que não
  // faz sentido ficar ativo (não mostraria nada no bio site).
  site.catalog.forEach((item) => { if (item.enabled && !item.name.trim() && !item.imageUrl?.trim()) errors.push("Existe item ativo no catálogo sem nome nem foto."); });
  return errors.length ? { ok: false, errors } : { ok: true, errors: [] };
}
