import { describe, it, expect } from "vitest";
import { COLOR_ROLES, colorSwatch, resolveColorStyle } from "./colorRoles";
import type { ColorValue } from "./types";

// Estes dois resolvedores leem dado gravado no banco (site_data.theme.colors).
// Existe bio site salvo ANTES da migração de 2026-09-06, quando cor era uma
// string simples ("#FF4D6D"). Se o formato antigo parar de ser aceito, todo
// bio site anterior à migração renderiza sem cor — regressão invisível em
// teste de UI, porque o dado antigo não está no código, está no banco.

const HEX_ANTIGO = "#FF4D6D";
const FALLBACK = "#111111";

// Valores que o banco pode devolver e que o TypeScript não protege (JSON solto).
const nulo = null as unknown as ColorValue | undefined;
const gradienteIncompleto = { mode: "gradient" } as unknown as ColorValue;

describe("resolveColorStyle — formato antigo (string simples)", () => {
  it("aplica string antiga como cor de texto", () => {
    expect(resolveColorStyle(HEX_ANTIGO, "text", FALLBACK)).toEqual({ color: HEX_ANTIGO });
  });

  it("aplica string antiga como fundo", () => {
    expect(resolveColorStyle(HEX_ANTIGO, "bg", FALLBACK)).toEqual({ background: HEX_ANTIGO });
  });
});

describe("resolveColorStyle — formato novo (objeto)", () => {
  it("aplica cor sólida como texto", () => {
    const val: ColorValue = { mode: "solid", value: "#00AAFF" };
    expect(resolveColorStyle(val, "text", FALLBACK)).toEqual({ color: "#00AAFF" });
  });

  it("aplica cor sólida como fundo", () => {
    const val: ColorValue = { mode: "solid", value: "#00AAFF" };
    expect(resolveColorStyle(val, "bg", FALLBACK)).toEqual({ background: "#00AAFF" });
  });

  it("aplica gradiente como imagem de fundo, sem mexer na cor do texto", () => {
    const val: ColorValue = { mode: "gradient", from: "#FF0000", to: "#0000FF" };
    const style = resolveColorStyle(val, "bg", FALLBACK);
    expect(style.backgroundImage).toBe("linear-gradient(135deg, #FF0000, #0000FF)");
    expect(style.color).toBeUndefined();
    expect(style.backgroundClip).toBeUndefined();
  });

  it("aplica gradiente em texto recortando o fundo e deixando a letra transparente", () => {
    const val: ColorValue = { mode: "gradient", from: "#FF0000", to: "#0000FF" };
    const style = resolveColorStyle(val, "text", FALLBACK);
    expect(style.backgroundImage).toBe("linear-gradient(135deg, #FF0000, #0000FF)");
    expect(style.backgroundClip).toBe("text");
    expect(style.WebkitBackgroundClip).toBe("text");
    expect(style.color).toBe("transparent");
    expect(style.WebkitTextFillColor).toBe("transparent");
  });
});

describe("resolveColorStyle — valor ausente ou malformado", () => {
  it("usa a cor padrão quando o role não foi configurado", () => {
    expect(resolveColorStyle(undefined, "text", FALLBACK)).toEqual({ color: FALLBACK });
    expect(resolveColorStyle(undefined, "bg", FALLBACK)).toEqual({ background: FALLBACK });
  });

  it("usa a cor padrão quando o banco devolve null", () => {
    expect(resolveColorStyle(nulo, "text", FALLBACK)).toEqual({ color: FALLBACK });
  });

  it("não quebra com gradiente sem from/to gravado (só perde a cor)", () => {
    // Documenta o comportamento atual: gera "linear-gradient(135deg,
    // undefined, undefined)", que o navegador ignora — a página não quebra,
    // mas o elemento fica sem cor nenhuma em vez de cair no fallback.
    const style = resolveColorStyle(gradienteIncompleto, "bg", FALLBACK);
    expect(style.backgroundImage).toContain("linear-gradient");
    expect(() => JSON.stringify(style)).not.toThrow();
  });
});

describe("colorSwatch", () => {
  it("devolve a própria string no formato antigo", () => {
    expect(colorSwatch(HEX_ANTIGO, FALLBACK)).toBe(HEX_ANTIGO);
  });

  it("devolve o valor de uma cor sólida", () => {
    expect(colorSwatch({ mode: "solid", value: "#123456" }, FALLBACK)).toBe("#123456");
  });

  it("usa o 'from' como cor representativa de um gradiente", () => {
    expect(colorSwatch({ mode: "gradient", from: "#AABBCC", to: "#DDEEFF" }, FALLBACK)).toBe("#AABBCC");
  });

  it("cai no padrão quando o role não foi configurado ou veio null", () => {
    expect(colorSwatch(undefined, FALLBACK)).toBe(FALLBACK);
    expect(colorSwatch(nulo, FALLBACK)).toBe(FALLBACK);
  });

  it("devolve string vazia quando a cor gravada é vazia (não cai no padrão)", () => {
    // Comportamento atual, não necessariamente o desejado: quem compõe
    // `${colorSwatch(...)}33` para gerar transparência acaba com "33", que
    // não é cor nenhuma. Ver relatório.
    expect(colorSwatch("", FALLBACK)).toBe("");
  });
});

describe("COLOR_ROLES", () => {
  it("descreve todo role com rótulo, dica, grupo e tipo válido", () => {
    for (const [role, meta] of Object.entries(COLOR_ROLES)) {
      expect(meta.label.trim(), `role ${role}`).not.toBe("");
      expect(meta.hint.trim(), `role ${role}`).not.toBe("");
      expect(meta.group.trim(), `role ${role}`).not.toBe("");
      expect(["text", "bg"], `role ${role}`).toContain(meta.kind);
    }
  });

  it("resolve todo role declarado sem lançar erro, usando o kind dele", () => {
    for (const meta of Object.values(COLOR_ROLES)) {
      expect(() => resolveColorStyle(undefined, meta.kind, FALLBACK)).not.toThrow();
    }
  });
});
