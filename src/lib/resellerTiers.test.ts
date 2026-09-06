import { describe, it, expect } from "vitest";
import { RESELLER_TIERS, resolveResellerTier, applyCoupon, applyResellerAttribution } from "./resellerTiers";
import { KIWIFY_LINKS } from "./subscriptions";

// Comissão de revendedor. Um erro aqui ou deixa de pagar quem vendeu
// (parâmetro afid perdido = venda não atribuída = comissão nunca cai, que já
// foi um furo real corrigido em 2026-07-17), ou dá desconto para quem não
// deveria.

describe("resolveResellerTier", () => {
  it("reconhece os dois planos que participam do programa", () => {
    expect(resolveResellerTier("freelancer")).toBe("freelancer");
    expect(resolveResellerTier("agency")).toBe("agency");
  });

  it("deixa Gratuito e Essencial de fora do programa", () => {
    expect(resolveResellerTier("free")).toBeNull();
    expect(resolveResellerTier("community")).toBeNull();
    expect(resolveResellerTier("pro")).toBeNull();
  });

  it("devolve null quando o perfil não tem plano gravado", () => {
    expect(resolveResellerTier(null)).toBeNull();
    expect(resolveResellerTier(undefined)).toBeNull();
    expect(resolveResellerTier("")).toBeNull();
  });

  it("é sensível a maiúsculas (plano gravado como 'Freelancer' fica de fora)", () => {
    // Comportamento atual, diferente de resolvePlanTier() em subscriptions.ts,
    // que faz lowercase antes de comparar. Ver relatório: divergência de
    // normalização entre dois lugares que leem o MESMO campo do banco.
    expect(resolveResellerTier("Freelancer")).toBeNull();
    expect(resolveResellerTier("AGENCY")).toBeNull();
  });
});

describe("applyCoupon", () => {
  it("não mexe na URL quando não há cupom", () => {
    expect(applyCoupon(KIWIFY_LINKS.freelancer, null)).toBe(KIWIFY_LINKS.freelancer);
  });

  it("abre a query string quando a URL ainda não tem nenhuma", () => {
    expect(applyCoupon("https://pay.kiwify.com.br/abc", "REVENDA10"))
      .toBe("https://pay.kiwify.com.br/abc?coupon=REVENDA10");
  });

  it("concatena quando a URL já tem query string", () => {
    expect(applyCoupon("https://pay.kiwify.com.br/abc?src=instagram", "REVENDA10"))
      .toBe("https://pay.kiwify.com.br/abc?src=instagram&coupon=REVENDA10");
  });

  it("escapa código de cupom com caractere especial", () => {
    expect(applyCoupon("https://pay.kiwify.com.br/abc", "10% OFF"))
      .toBe("https://pay.kiwify.com.br/abc?coupon=10%25%20OFF");
  });
});

describe("applyResellerAttribution", () => {
  it("cola cupom e afid na ordem esperada pela Kiwify", () => {
    expect(applyResellerAttribution("https://pay.kiwify.com.br/abc", "REVENDA15", "aff_123"))
      .toBe("https://pay.kiwify.com.br/abc?coupon=REVENDA15&afid=aff_123");
  });

  it("atribui a venda mesmo sem cupom", () => {
    expect(applyResellerAttribution("https://pay.kiwify.com.br/abc", null, "aff_123"))
      .toBe("https://pay.kiwify.com.br/abc?afid=aff_123");
  });

  it("volta ao comportamento de só cupom quando o revendedor ainda não sincronizou o afiliado", () => {
    expect(applyResellerAttribution("https://pay.kiwify.com.br/abc", "REVENDA10", null))
      .toBe("https://pay.kiwify.com.br/abc?coupon=REVENDA10");
  });

  it("não altera a URL quando não há cupom nem afiliado", () => {
    const url = "https://pay.kiwify.com.br/abc";
    expect(applyResellerAttribution(url, null, null)).toBe(url);
  });

  it("sempre gera uma URL válida e com afid legível de volta", () => {
    const url = new URL(applyResellerAttribution(KIWIFY_LINKS.agency, "REVENDA15", "aff/123"));
    expect(url.searchParams.get("afid")).toBe("aff/123");
    expect(url.searchParams.get("coupon")).toBe("REVENDA15");
  });
});

describe("RESELLER_TIERS", () => {
  it("paga mais comissão e dá mais desconto na Agência do que no Freelancer", () => {
    expect(RESELLER_TIERS.agency.commissionPct).toBeGreaterThan(RESELLER_TIERS.freelancer.commissionPct);
    expect(RESELLER_TIERS.agency.buyerDiscountPct).toBeGreaterThan(RESELLER_TIERS.freelancer.buyerDiscountPct);
    expect(RESELLER_TIERS.agency.bonusSites).toBeGreaterThanOrEqual(RESELLER_TIERS.freelancer.bonusSites);
  });

  it("mantém comissão e desconto dentro de uma faixa que não zera a margem", () => {
    for (const tier of Object.values(RESELLER_TIERS)) {
      expect(tier.commissionPct).toBeGreaterThan(0);
      expect(tier.commissionPct + tier.buyerDiscountPct).toBeLessThan(100);
    }
  });

  it("não compartilha cupom nem link de afiliado entre os dois tiers", () => {
    expect(RESELLER_TIERS.agency.kiwifyCouponCode).not.toBe(RESELLER_TIERS.freelancer.kiwifyCouponCode);
    expect(RESELLER_TIERS.agency.kiwifyAffiliateApplyUrl).not.toBe(RESELLER_TIERS.freelancer.kiwifyAffiliateApplyUrl);
  });

  it("usa cupom sem caractere que precise de escape na URL", () => {
    for (const tier of Object.values(RESELLER_TIERS)) {
      expect(encodeURIComponent(tier.kiwifyCouponCode)).toBe(tier.kiwifyCouponCode);
    }
  });
});
