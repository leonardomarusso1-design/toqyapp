import { describe, it, expect } from "vitest";
import { resolvePlan, shouldDowngradeOnCancel, resolveAttributionStatus } from "./webhookLogic";

// Primeira suíte de teste do projeto (Fase 1 do roadmap, 2026-07-16 —
// ver .planning/ROADMAP.md). Escopo deliberadamente pequeno: só a lógica
// pura que decide plano/downgrade, não o handler HTTP inteiro (que
// dependeria de mockar Supabase/Request). Justificativa: esta é a lógica
// que mexe com cobrança e acesso pago — regressão silenciosa aqui rebaixa
// (ou deixa de cobrar) cliente de verdade.

describe("resolvePlan", () => {
  it("reconhece Essencial pelo nome do produto (comunidade)", () => {
    expect(resolvePlan("TOQY Comunidade Mensal")).toEqual({ plan: "community", limit: 20 });
  });

  it("reconhece Freelancer pelo nome do produto", () => {
    expect(resolvePlan("TOQY Freelancer")).toEqual({ plan: "freelancer", limit: 20 });
  });

  it("reconhece Freelancer mesmo com nome do novo produto recorrente", () => {
    expect(resolvePlan("TOQY Freelancer Mensal")).toEqual({ plan: "freelancer", limit: 20 });
  });

  it("reconhece Agência (com e sem acento)", () => {
    expect(resolvePlan("TOQY Agencia")).toEqual({ plan: "agency", limit: 100 });
    expect(resolvePlan("TOQY Agência")).toEqual({ plan: "agency", limit: 100 });
  });

  it("retorna null pra produto desconhecido (não é plano TOQY)", () => {
    expect(resolvePlan("Produto qualquer sem relação")).toBeNull();
  });
});

describe("shouldDowngradeOnCancel", () => {
  it("rebaixa perfil sem legacy_lifetime_access (comportamento padrão)", () => {
    expect(shouldDowngradeOnCancel({ legacy_lifetime_access: false })).toBe(true);
  });

  it("NUNCA rebaixa perfil com legacy_lifetime_access true (comprador legado de pagamento único)", () => {
    expect(shouldDowngradeOnCancel({ legacy_lifetime_access: true })).toBe(false);
  });

  it("rebaixa quando o perfil não tem o campo definido (undefined = não migrado/legado)", () => {
    expect(shouldDowngradeOnCancel({})).toBe(true);
  });

  it("rebaixa quando o perfil não foi encontrado (null/undefined)", () => {
    expect(shouldDowngradeOnCancel(null)).toBe(true);
    expect(shouldDowngradeOnCancel(undefined)).toBe(true);
  });
});

describe("resolveAttributionStatus", () => {
  it("marca 'matched' quando o afiliado da venda é o revendedor esperado", () => {
    expect(resolveAttributionStatus("aff_123", "aff_123")).toBe("matched");
  });

  it("marca 'affiliate_mismatch' quando o afiliado da venda é diferente do esperado", () => {
    expect(resolveAttributionStatus("aff_123", "aff_999")).toBe("affiliate_mismatch");
  });

  it("marca 'affiliate_mismatch' quando o revendedor ainda não tem kiwify_affiliate_id cadastrado", () => {
    expect(resolveAttributionStatus(null, "aff_999")).toBe("affiliate_mismatch");
    expect(resolveAttributionStatus(undefined, "aff_999")).toBe("affiliate_mismatch");
  });

  it("marca 'affiliate_mismatch' quando a venda não tem afiliado atribuído pela Kiwify", () => {
    expect(resolveAttributionStatus("aff_123", null)).toBe("affiliate_mismatch");
    expect(resolveAttributionStatus("aff_123", undefined)).toBe("affiliate_mismatch");
  });
});
