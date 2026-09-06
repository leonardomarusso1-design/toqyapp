import { describe, it, expect } from "vitest";
import {
  normalizeSlug,
  generateSlug,
  generateEditKey,
  sanitizeText,
  ensureUrl,
  normalizePhone,
  normalizeInstagram,
  isValidUrl,
} from "./security";

// Higiene de entrada e chave de acesso. Duas coisas custam caro aqui:
// (1) ensureUrl deixar passar um esquema executável (javascript:/data:) para
//     dentro de um href renderizado no bio site público;
// (2) generateEditKey perder entropia — a edit_key dá acesso total de edição
//     do bio site, incluindo trocar a chave Pix do negócio.

describe("normalizeSlug / generateSlug", () => {
  it("remove acento e transforma espaço em hífen", () => {
    expect(generateSlug("Café da Manhã")).toBe("cafe-da-manha");
    expect(generateSlug("Ação & Reação")).toBe("acao-reacao");
  });

  it("passa tudo para minúsculo", () => {
    expect(generateSlug("BARBEARIA DO ZÉ")).toBe("barbearia-do-ze");
  });

  it("mantém números", () => {
    expect(generateSlug("Pizzaria 24 Horas")).toBe("pizzaria-24-horas");
  });

  it("colapsa símbolos e pontuação em um hífen só", () => {
    expect(generateSlug("Loja!!!  do   João???")).toBe("loja-do-joao");
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(generateSlug("---Loja---")).toBe("loja");
    expect(generateSlug("  Loja  ")).toBe("loja");
  });

  it("usa o slug padrão quando não sobra nada aproveitável", () => {
    expect(generateSlug("")).toBe("novo-toqy");
    expect(generateSlug("   ")).toBe("novo-toqy");
    expect(generateSlug("🎉🎉🎉")).toBe("novo-toqy");
    expect(generateSlug("!@#$%")).toBe("novo-toqy");
  });

  it("descarta emoji mas preserva o texto ao redor", () => {
    expect(generateSlug("Sorveteria 🍦 Gelato")).toBe("sorveteria-gelato");
  });

  it("limita o slug a 64 caracteres", () => {
    const slug = normalizeSlug("a".repeat(200));
    expect(slug).toHaveLength(64);
  });

  // BUG REAL (achado 2026-09-06 escrevendo este teste): o corte em 64
  // caracteres roda DEPOIS da limpeza de hífen das pontas, então um nome
  // longo o bastante gera slug terminando em "-" — exatamente o que a linha
  // anterior da função tenta evitar. Vira URL pública feia e, pior, dois
  // nomes diferentes podem colidir no mesmo slug truncado. Conserto: inverter
  // a ordem (slice antes do replace de pontas, ou repetir o replace no fim).
  it("nunca termina em hífen, mesmo quando o corte de 64 cai em cima de um", () => {
    const slug = normalizeSlug("a ".repeat(40));
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("generateEditKey", () => {
  it("gera três grupos de quatro dígitos, fácil de ditar por telefone", () => {
    expect(generateEditKey()).toMatch(/^\d{4}-\d{4}-\d{4}$/);
  });

  it("mantém todo grupo dentro da faixa de 4 dígitos (nunca 0123 ou 12345)", () => {
    for (let i = 0; i < 200; i++) {
      for (const grupo of generateEditKey().split("-")) {
        expect(grupo).toHaveLength(4);
        expect(Number(grupo)).toBeGreaterThanOrEqual(1000);
        expect(Number(grupo)).toBeLessThanOrEqual(9999);
      }
    }
  });

  it("não repete chave em 500 gerações seguidas", () => {
    const chaves = new Set(Array.from({ length: 500 }, () => generateEditKey()));
    expect(chaves.size).toBe(500);
  });

  it("varia os três grupos entre si (não gera 1234-1234-1234 sistematicamente)", () => {
    const iguais = Array.from({ length: 200 }, () => generateEditKey())
      .filter((k) => new Set(k.split("-")).size === 1);
    // Colisão dos 3 grupos por acaso é ~1 em 81 milhões; qualquer ocorrência
    // em 200 tentativas indica fonte de aleatoriedade quebrada.
    expect(iguais).toHaveLength(0);
  });
});

describe("ensureUrl", () => {
  it("neutraliza javascript: prefixando com https (não vira href executável)", () => {
    expect(ensureUrl("javascript:alert(1)")).toBe("https://javascript:alert(1)");
    expect(ensureUrl("JavaScript:alert(1)")).toBe("https://JavaScript:alert(1)");
    expect(ensureUrl("  javascript:alert(1)  ")).toBe("https://javascript:alert(1)");
  });

  it("neutraliza outros esquemas perigosos do mesmo jeito", () => {
    expect(ensureUrl("data:text/html,<script>alert(1)</script>")).toMatch(/^https:\/\/data:/);
    expect(ensureUrl("vbscript:msgbox(1)")).toBe("https://vbscript:msgbox(1)");
    expect(ensureUrl("file:///etc/passwd")).toBe("https://file:///etc/passwd");
  });

  it("marca como inválido o que sobra de um esquema perigoso neutralizado", () => {
    // Rede de segurança da validação de formulário: depois do prefixo, o
    // resultado não é sequer uma URL parseável, então validateSite recusa.
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,x")).toBe(false);
  });

  it("preserva http e https já explícitos", () => {
    expect(ensureUrl("https://toqy.com.br")).toBe("https://toqy.com.br");
    expect(ensureUrl("http://toqy.com.br")).toBe("http://toqy.com.br");
    expect(ensureUrl("HTTPS://TOQY.COM.BR")).toBe("HTTPS://TOQY.COM.BR");
  });

  it("preserva os esquemas de contato usados nos botões", () => {
    expect(ensureUrl("mailto:contato@toqy.com.br")).toBe("mailto:contato@toqy.com.br");
    expect(ensureUrl("tel:+5519999999999")).toBe("tel:+5519999999999");
    expect(ensureUrl("sms:+5519999999999")).toBe("sms:+5519999999999");
  });

  it("completa domínio digitado sem esquema", () => {
    expect(ensureUrl("toqy.com.br")).toBe("https://toqy.com.br");
    expect(ensureUrl("  toqy.com.br/plano  ")).toBe("https://toqy.com.br/plano");
  });

  it("devolve string vazia quando não há link", () => {
    expect(ensureUrl()).toBe("");
    expect(ensureUrl("")).toBe("");
    expect(ensureUrl("    ")).toBe("");
  });
});

describe("normalizeInstagram", () => {
  it("monta a URL do perfil a partir do @", () => {
    expect(normalizeInstagram("@toqyapp")).toBe("https://instagram.com/toqyapp");
  });

  it("monta a URL do perfil a partir do usuário sem @", () => {
    expect(normalizeInstagram("toqyapp")).toBe("https://instagram.com/toqyapp");
  });

  it("preserva URL completa já informada", () => {
    expect(normalizeInstagram("https://instagram.com/toqyapp")).toBe("https://instagram.com/toqyapp");
    expect(normalizeInstagram("http://www.instagram.com/toqyapp")).toBe("http://www.instagram.com/toqyapp");
  });

  it("neutraliza javascript: tratando como se fosse nome de usuário", () => {
    expect(normalizeInstagram("javascript:alert(1)")).toBe("https://instagram.com/javascript:alert(1)");
  });

  it("devolve string vazia quando não há Instagram", () => {
    expect(normalizeInstagram()).toBe("");
    expect(normalizeInstagram("")).toBe("");
    expect(normalizeInstagram("   ")).toBe("");
  });
});

describe("normalizePhone", () => {
  it("mantém só os dígitos de um telefone brasileiro formatado", () => {
    expect(normalizePhone("(19) 99999-9999")).toBe("19999999999");
    expect(normalizePhone("+55 19 99999-9999")).toBe("5519999999999");
  });

  it("devolve string vazia quando não há telefone", () => {
    expect(normalizePhone()).toBe("");
    expect(normalizePhone("sem número")).toBe("");
  });
});

describe("sanitizeText", () => {
  it("remove os sinais que abririam uma tag HTML", () => {
    expect(sanitizeText("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
    expect(sanitizeText("  Barbearia <b>do Zé</b>  ")).toBe("Barbearia bdo Zé/b");
  });
});

describe("isValidUrl", () => {
  it("aceita campo vazio (link é opcional)", () => {
    expect(isValidUrl()).toBe(true);
    expect(isValidUrl("")).toBe(true);
  });

  it("aceita domínio digitado sem esquema", () => {
    expect(isValidUrl("toqy.com.br")).toBe(true);
  });

  it("recusa texto que não vira URL nenhuma", () => {
    expect(isValidUrl("https://")).toBe(false);
  });
});
