import type { ToqySite } from "./types";

export function createPixProofMessage(site: ToqySite) {
  return `Olá! Acabei de realizar um pagamento via Pix para ${site.profile.name}. Segue meu comprovante.`;
}
