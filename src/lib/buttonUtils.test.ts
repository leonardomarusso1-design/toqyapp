import { describe, expect, it } from "vitest";
import { catalogItemWhatsappUrl } from "./buttonUtils";
import type { CatalogItem, ToqySite } from "./types";

function site(overrides: Partial<ToqySite["contact"]> = {}): ToqySite {
  return {
    contact: { whatsapp: "11999998888", phone: "", whatsappMessage: "Olá, gostaria de mais informações.", ...overrides },
  } as unknown as ToqySite;
}

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return { id: "i1", name: "Corte Degradê", description: "", price: "R$ 45", enabled: true, imageLayout: "square", ...overrides } as CatalogItem;
}

describe("catalogItemWhatsappUrl", () => {
  it("põe nome + preço + link no texto", () => {
    const url = catalogItemWhatsappUrl(site(), item(), "https://toqy.com.br/b/x");
    const text = decodeURIComponent(new URL(url).searchParams.get("text")!);
    expect(text).toContain("Corte Degradê");
    expect(text).toContain("R$ 45");
    expect(text).toContain("https://toqy.com.br/b/x");
  });

  it("sem preço, só nome + link", () => {
    const url = catalogItemWhatsappUrl(site(), item({ price: "" }), "https://toqy.com.br/b/x");
    const text = decodeURIComponent(new URL(url).searchParams.get("text")!);
    expect(text).toContain("Corte Degradê");
    expect(text).not.toContain("()");
  });

  it("item sem nome cai na mensagem genérica do site", () => {
    const url = catalogItemWhatsappUrl(site(), item({ name: "" }), "https://toqy.com.br/b/x");
    const text = decodeURIComponent(new URL(url).searchParams.get("text")!);
    expect(text).toBe("Olá, gostaria de mais informações.");
  });

  it("sem telefone, string vazia", () => {
    expect(catalogItemWhatsappUrl(site({ whatsapp: "", phone: "" }), item())).toBe("");
  });
});
