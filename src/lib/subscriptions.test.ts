import { describe, it, expect } from "vitest";
import {
  SUBSCRIPTION_PLANS,
  SELLABLE_PLANS,
  KIWIFY_LINKS,
  OVERAGE_LINKS,
  PLAN_FEATURES_COMPARISON,
  resolvePlanTier,
  getPlan,
  isPremiumPlan,
  canUseStickersAndMusic,
  canUseWhiteLabel,
  canCreateSite,
  formatPrice,
  getAnnualSavings,
  type PlanType,
} from "./subscriptions";
import { PLAN_BIOSITE_LIMITS } from "./planConstants";

// Esta é a fonte de verdade de plano/preço/limite do produto inteiro. Um erro
// aqui ou libera recurso pago de graça, ou bloqueia cliente que está pagando.
// Os testes de invariante no fim do arquivo existem porque o histórico do
// projeto já teve exatamente esse tipo de bug: o limite do Essencial estava
// duplicado e divergente (20 num lugar, 10 no outro) e toda compra real
// gravava o dobro do prometido.

const ALL_PLANS = Object.keys(SUBSCRIPTION_PLANS) as PlanType[];

describe("resolvePlanTier", () => {
  it("aceita todos os planos válidos sem alterar o valor", () => {
    for (const plan of ALL_PLANS) {
      expect(resolvePlanTier(plan)).toBe(plan);
    }
  });

  it("normaliza plano gravado em maiúsculas no banco", () => {
    expect(resolvePlanTier("AGENCY")).toBe("agency");
    expect(resolvePlanTier("Community")).toBe("community");
  });

  it("cai em 'free' quando o perfil não tem plano gravado", () => {
    expect(resolvePlanTier(null)).toBe("free");
    expect(resolvePlanTier(undefined)).toBe("free");
    expect(resolvePlanTier("")).toBe("free");
  });

  it("cai em 'free' para plano legado/descontinuado que não existe mais", () => {
    expect(resolvePlanTier("premium")).toBe("free");
    expect(resolvePlanTier("comunidade")).toBe("free");
    expect(resolvePlanTier("agencia")).toBe("free");
  });

  it("cai em 'free' quando o valor vem com espaço em volta", () => {
    // Documenta o comportamento atual: resolvePlanTier faz lowercase mas NÃO
    // faz trim. Um " agency " vindo do banco vira "free" (falha fechada, mas
    // o cliente perde acesso pago — vale saber que é assim).
    expect(resolvePlanTier(" agency ")).toBe("free");
  });

  // BUG REAL (achado 2026-09-06 escrevendo este teste): o check usa o operador
  // `in`, que enxerga a cadeia de protótipo. "constructor", "toString",
  // "valueOf", "__proto__" etc. passam como se fossem planos válidos, em vez
  // de cair no fallback "free" que o comentário da função promete. Pior: o
  // valor devolvido não é "free", então isPremiumPlan() responde TRUE pra ele
  // (ver teste seguinte). O conserto é `Object.hasOwn(SUBSCRIPTION_PLANS, n)`.
  it("cai em 'free' para nomes herdados de Object.prototype", () => {
    expect(resolvePlanTier("constructor")).toBe("free");
    expect(resolvePlanTier("toString")).toBe("free");
    expect(resolvePlanTier("__proto__")).toBe("free");
  });

  it("nunca trata um plano inexistente como premium", () => {
    // Consequência do bug acima no caminho de /api/biosite/save, que faz
    // exatamente `isPremiumPlan(resolvePlanTier(plano_do_banco))`.
    expect(isPremiumPlan(resolvePlanTier("constructor"))).toBe(false);
  });
});

describe("capacidades por plano", () => {
  it("libera figurinhas e música só no Pro, Freelancer e Agência", () => {
    expect(canUseStickersAndMusic("free")).toBe(false);
    expect(canUseStickersAndMusic("pro")).toBe(true);
    // Essencial é pago mas fica de fora de propósito — não é a mesma regra
    // de isPremiumPlan. Se isto virar `true`, a regra de negócio quebrou.
    expect(canUseStickersAndMusic("community")).toBe(false);
    expect(canUseStickersAndMusic("freelancer")).toBe(true);
    expect(canUseStickersAndMusic("agency")).toBe(true);
  });

  it("mantém o selo do Toqy em todo plano que não seja Agência", () => {
    for (const plan of ALL_PLANS) {
      expect(canUseWhiteLabel(plan)).toBe(plan === "agency");
    }
  });

  it("não deixa nenhum recurso pago vazar para o plano Gratuito", () => {
    const free = getPlan("free");
    expect(free.priceMonthly).toBe(0);
    expect(free.hasCatalog).toBe(false);
    expect(free.hasPix).toBe(false);
    expect(free.hasWifi).toBe(false);
    expect(free.hasCustomQr).toBe(false);
    expect(free.hasCustomDomain).toBe(false);
    expect(free.hasAnalytics).toBe(false);
    expect(free.hasStickersAndMusic).toBe(false);
    expect(free.hasWhiteLabel).toBe(false);
  });

  it("considera premium todo plano pago e só ele", () => {
    for (const plan of ALL_PLANS) {
      expect(isPremiumPlan(plan)).toBe(getPlan(plan).priceMonthly > 0);
    }
  });
});

describe("canCreateSite", () => {
  it("bloqueia exatamente ao atingir o limite do plano, não depois", () => {
    for (const plan of ALL_PLANS) {
      const max = getPlan(plan).maxSites;
      expect(canCreateSite(plan, max - 1)).toBe(true);
      expect(canCreateSite(plan, max)).toBe(false);
      expect(canCreateSite(plan, max + 1)).toBe(false);
    }
  });

  it("permite o primeiro site em qualquer plano, inclusive o Gratuito", () => {
    for (const plan of ALL_PLANS) {
      expect(canCreateSite(plan, 0)).toBe(true);
    }
  });
});

describe("preços", () => {
  it("formata em real brasileiro", () => {
    // Sem comparar a string inteira: o separador entre "R$" e o número varia
    // por versão do ICU (espaço normal vs não-quebrável).
    expect(formatPrice(9.9)).toContain("R$");
    expect(formatPrice(9.9)).toContain("9,90");
    expect(formatPrice(0)).toContain("0,00");
    expect(formatPrice(1234.5)).toContain("1.234,50");
  });

  it("calcula a economia anual como 12 mensalidades menos o preço anual", () => {
    expect(getAnnualSavings("pro")).toBeCloseTo(9.9 * 12 - 99, 2);
    expect(getAnnualSavings("agency")).toBeCloseTo(99.9 * 12 - 999, 2);
  });

  it("não promete economia anual em plano sem preço anual", () => {
    expect(getAnnualSavings("free")).toBeNull();
  });

  it("nunca cobra mais no anual do que 12 meses avulsos", () => {
    for (const plan of ALL_PLANS) {
      const savings = getAnnualSavings(plan);
      if (savings !== null) expect(savings).toBeGreaterThan(0);
    }
  });

  it("mantém a escada de preço Gratuito < Pro < Essencial < Freelancer < Agência", () => {
    const ordem: PlanType[] = ["free", "pro", "community", "freelancer", "agency"];
    for (let i = 1; i < ordem.length; i++) {
      expect(getPlan(ordem[i]).priceMonthly).toBeGreaterThan(getPlan(ordem[i - 1]).priceMonthly);
    }
  });
});

describe("consistência entre planos, limites e links de cobrança", () => {
  it("todo plano declarado tem limite de bio sites definido e igual ao maxSites", () => {
    for (const plan of ALL_PLANS) {
      expect(PLAN_BIOSITE_LIMITS).toHaveProperty(plan);
      expect(getPlan(plan).maxSites).toBe(PLAN_BIOSITE_LIMITS[plan]);
    }
  });

  it("não existe limite de bio site para plano que não existe mais", () => {
    for (const tier of Object.keys(PLAN_BIOSITE_LIMITS)) {
      expect(ALL_PLANS).toContain(tier as PlanType);
    }
  });

  it("todo plano vendável existe no catálogo de planos", () => {
    for (const plan of SELLABLE_PLANS) {
      expect(SUBSCRIPTION_PLANS[plan]).toBeDefined();
    }
  });

  it("todo plano pago tem link de checkout e o Gratuito não tem", () => {
    for (const plan of ALL_PLANS) {
      if (plan === "free") continue;
      expect(KIWIFY_LINKS[plan]).toMatch(/^https:\/\/pay\.kiwify\.com\.br\/\w+$/);
    }
    expect(Object.keys(KIWIFY_LINKS)).not.toContain("free");
  });

  it("nenhum plano compartilha link de checkout com outro (cobraria o produto errado)", () => {
    const links = Object.values(KIWIFY_LINKS);
    expect(new Set(links).size).toBe(links.length);
  });

  it("nenhum produto avulso reusa link de plano (viraria upgrade de graça)", () => {
    const overage = Object.values(OVERAGE_LINKS);
    expect(new Set(overage).size).toBe(overage.length);
    for (const link of overage) {
      expect(Object.values(KIWIFY_LINKS)).not.toContain(link);
    }
  });

  it("a tabela comparativa mostra o mesmo número de bio sites que o sistema aplica", () => {
    // Esta constante hoje não é renderizada, mas já teve o número errado
    // (community como "20") — o mesmo bug que gravava o dobro do limite em
    // compras reais. Se voltar a ser exibida, precisa bater com a regra real.
    const linha = PLAN_FEATURES_COMPARISON.find((l) => l.feature === "Bio sites");
    expect(linha).toBeDefined();
    expect(linha?.free).toBe(String(PLAN_BIOSITE_LIMITS.free));
    expect(linha?.community).toBe(String(PLAN_BIOSITE_LIMITS.community));
    expect(linha?.freelancer).toBe(String(PLAN_BIOSITE_LIMITS.freelancer));
    expect(linha?.agency).toBe(String(PLAN_BIOSITE_LIMITS.agency));
  });

  it("o id declarado dentro do plano bate com a chave do catálogo", () => {
    for (const plan of ALL_PLANS) {
      expect(SUBSCRIPTION_PLANS[plan].id).toBe(plan);
    }
  });
});
