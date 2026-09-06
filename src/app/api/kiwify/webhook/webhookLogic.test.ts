import { describe, it, expect } from "vitest";
import { resolvePlan, resolveOverageProduct, shouldDowngradeOnCancel, resolveAttributionStatus } from "./webhookLogic";

// Primeira suíte de teste do projeto (Fase 1 do roadmap, 2026-07-16 —
// ver .planning/ROADMAP.md). Escopo deliberadamente pequeno: só a lógica
// pura que decide plano/downgrade, não o handler HTTP inteiro (que
// dependeria de mockar Supabase/Request). Justificativa: esta é a lógica
// que mexe com cobrança e acesso pago — regressão silenciosa aqui rebaixa
// (ou deixa de cobrar) cliente de verdade.

describe("resolvePlan", () => {
  it("reconhece Essencial pelo nome do produto (comunidade)", () => {
    expect(resolvePlan("TOQY Comunidade Mensal")).toEqual({ plan: "community", limit: 10 });
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

describe("resolveOverageProduct", () => {
  it("reconhece o produto de bio site extra", () => {
    expect(resolveOverageProduct("TOQY - Bio Site Extra")).toBe("biosite");
  });

  it("reconhece o produto de crédito de arte extra (com e sem acento)", () => {
    expect(resolveOverageProduct("TOQY - Crédito de Arte Extra")).toBe("ai_art_credit");
    expect(resolveOverageProduct("TOQY - Credito de Arte Extra")).toBe("ai_art_credit");
  });

  it("retorna null pra produto desconhecido", () => {
    expect(resolveOverageProduct("Produto qualquer sem relação")).toBeNull();
  });

  it("NUNCA classifica um produto de plano normal como overage (regressão)", () => {
    expect(resolveOverageProduct("TOQY Freelancer Mensal")).toBeNull();
    expect(resolveOverageProduct("TOQY Agência")).toBeNull();
    expect(resolveOverageProduct("TOQY Comunidade Mensal")).toBeNull();
  });

  it("resolvePlan nunca classifica um produto de overage como plano (regressão)", () => {
    expect(resolvePlan("TOQY - Bio Site Extra")).toBeNull();
    expect(resolvePlan("TOQY - Crédito de Arte Extra")).toBeNull();
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

// Caminhos que a suíte original não cobria (ampliação de 2026-09-06).

describe("resolvePlan — Pro Pessoal e colisão de nome de produto", () => {
  it("reconhece o Pro Pessoal pelo nome do produto", () => {
    expect(resolvePlan("TOQY Pro")).toEqual({ plan: "pro", limit: 1 });
    expect(resolvePlan("TOQY Pro Mensal")).toEqual({ plan: "pro", limit: 1 });
  });

  it("reconhece o plano independente de caixa alta ou baixa", () => {
    expect(resolvePlan("toqy pro")).toEqual({ plan: "pro", limit: 1 });
    expect(resolvePlan("TOQY FREELANCER")).toEqual({ plan: "freelancer", limit: 20 });
  });

  it("não confunde o add-on de domínio com um plano", () => {
    expect(resolvePlan("TOQY - Domínio Próprio")).toBeNull();
  });

  // BUG REAL (achado 2026-09-06 escrevendo este teste): o comentário da função
  // promete "match estrito em 'toqy pro' pra nunca colidir por engano", mas
  // includes() casa com QUALQUER nome que comece por "TOQY Pro" — "TOQY
  // Promoção", "TOQY Produto X", "TOQY Profissional" todos viram o plano Pro.
  // Consequência concreta: se um cliente Agência comprar um produto avulso
  // com nome assim, o webhook grava plan_toqy="pro" e biosites_limit=1 — ele
  // perde 99 bio sites e paga R$99,90 por um plano de R$9,90. Conserto:
  // comparar por igualdade/limite de palavra em vez de includes(), ou casar o
  // id do produto da Kiwify em vez do nome.
  it("não reconhece como Pro um produto que apenas COMEÇA com 'TOQY Pro'", () => {
    expect(resolvePlan("TOQY Promoção de Natal")).toBeNull();
    expect(resolvePlan("TOQY Produto Avulso")).toBeNull();
  });
});

describe("resolveOverageProduct — add-on de domínio próprio", () => {
  it("reconhece o domínio próprio com e sem acento", () => {
    expect(resolveOverageProduct("TOQY - Domínio Próprio")).toBe("custom_domain_addon");
    expect(resolveOverageProduct("TOQY - Dominio Proprio")).toBe("custom_domain_addon");
  });

  it("não classifica o plano Pro Pessoal como add-on", () => {
    expect(resolveOverageProduct("TOQY Pro")).toBeNull();
  });
});

describe("nomes reais de produto da Kiwify não se confundem entre si", () => {
  // O webhook roda resolveOverageProduct() ANTES de resolvePlan() (ver
  // route.ts): se um nome de PLANO casar como add-on, o cliente paga a
  // assinatura e recebe só o avulso — o plano nunca é concedido.
  const PRODUTOS_DE_PLANO = ["TOQY Pro", "TOQY Comunidade Mensal", "TOQY Freelancer", "TOQY Agência"];
  const PRODUTOS_AVULSOS = ["TOQY - Bio Site Extra", "TOQY - Crédito de Arte Extra", "TOQY - Domínio Próprio"];

  it("nenhum produto de plano é classificado como avulso", () => {
    for (const nome of PRODUTOS_DE_PLANO) {
      expect(resolveOverageProduct(nome), nome).toBeNull();
      expect(resolvePlan(nome), nome).not.toBeNull();
    }
  });

  it("nenhum produto avulso é classificado como plano", () => {
    for (const nome of PRODUTOS_AVULSOS) {
      expect(resolvePlan(nome), nome).toBeNull();
      expect(resolveOverageProduct(nome), nome).not.toBeNull();
    }
  });

  it("cada produto avulso resolve para um tipo diferente", () => {
    const tipos = PRODUTOS_AVULSOS.map((nome) => resolveOverageProduct(nome));
    expect(new Set(tipos).size).toBe(PRODUTOS_AVULSOS.length);
  });
});

describe("shouldDowngradeOnCancel — casos de banco", () => {
  it("rebaixa quando a coluna existe mas está nula (perfil nunca migrado)", () => {
    expect(shouldDowngradeOnCancel({ legacy_lifetime_access: null })).toBe(true);
  });
});

describe("resolveAttributionStatus", () => {
  it("marca 'matched' quando o afiliado da venda é o revendedor esperado", () => {
    expect(resolveAttributionStatus("aff_123", "aff_123")).toBe("matched");
  });

  it("marca 'affiliate_mismatch' quando algum dos ids vem vazio", () => {
    expect(resolveAttributionStatus("", "aff_123")).toBe("affiliate_mismatch");
    expect(resolveAttributionStatus("aff_123", "")).toBe("affiliate_mismatch");
  });

  it("exige o id idêntico, sem tolerar diferença de caixa ou espaço", () => {
    expect(resolveAttributionStatus("aff_123", "AFF_123")).toBe("affiliate_mismatch");
    expect(resolveAttributionStatus("aff_123", " aff_123")).toBe("affiliate_mismatch");
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
