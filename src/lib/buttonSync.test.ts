import { describe, it, expect } from "vitest";
import { syncModulesFromButtons } from "./buttonSync";
import type { ToqyButton, ToqySite } from "./types";

// Regressão do bug real (2026-09-08, reportado ao vivo com print): "se
// eu marco apenas o botao de cima, todos os botoes ficam com CTA EM
// DESTAQUE" — duplicar um botão que já era principal copiava isPrimary
// junto, deixando 2+ botões marcados ao mesmo tempo. syncModulesFromButtons
// roda em todo commit/save, então é o lugar certo pra garantir o
// invariante "só 1 botão principal" para sempre, não só na hora do clique.
function btn(overrides: Partial<ToqyButton> = {}): ToqyButton {
  return { id: overrides.id ?? "btn-1", type: "custom", label: "Botão", url: "", enabled: true, ...overrides };
}

function siteWithButtons(buttons: ToqyButton[]): ToqySite {
  return { buttons } as ToqySite;
}

describe("syncModulesFromButtons — invariante de botão principal", () => {
  it("mantém só o primeiro isPrimary:true quando 2+ botões estão marcados", () => {
    const site = siteWithButtons([
      btn({ id: "a", isPrimary: true }),
      btn({ id: "b", isPrimary: true }),
      btn({ id: "c" }),
    ]);
    const result = syncModulesFromButtons(site);
    expect(result.buttons.filter((b) => b.isPrimary === true)).toHaveLength(1);
    expect(result.buttons.find((b) => b.id === "a")?.isPrimary).toBe(true);
    expect(result.buttons.find((b) => b.id === "b")?.isPrimary).toBeUndefined();
  });

  it("não mexe em nada quando só 1 botão está marcado", () => {
    const site = siteWithButtons([btn({ id: "a" }), btn({ id: "b", isPrimary: true })]);
    const result = syncModulesFromButtons(site);
    expect(result.buttons.find((b) => b.id === "b")?.isPrimary).toBe(true);
    expect(result.buttons.find((b) => b.id === "a")?.isPrimary).toBeUndefined();
  });

  it("não mexe em nada quando nenhum botão está marcado", () => {
    const site = siteWithButtons([btn({ id: "a" }), btn({ id: "b" })]);
    const result = syncModulesFromButtons(site);
    expect(result.buttons.every((b) => b.isPrimary === undefined)).toBe(true);
  });
});
