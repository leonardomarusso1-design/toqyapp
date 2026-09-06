import { describe, it, expect } from "vitest";
import { getClientIp } from "./rateLimit";

// getClientIp monta a chave de rate limit das rotas sensíveis (verificação de
// edit_key, save de bio site, webhook). Se ela devolver o mesmo valor para
// gente diferente, o limite vira global e um usuário legítimo é bloqueado
// por causa de outro; se devolver valores diferentes para a MESMA origem, o
// limite deixa de existir e a edit_key volta a ser forçável por tentativa.

function req(headers: Record<string, string>): Request {
  return new Request("https://toqy.com.br/api/biosite/save", { headers });
}

describe("getClientIp", () => {
  it("usa o IP do cliente informado pelo proxy", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("pega o primeiro IP da cadeia (o cliente), não o último proxy", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" })))
      .toBe("203.0.113.7");
  });

  it("tira o espaço em volta do IP da cadeia", () => {
    expect(getClientIp(req({ "x-forwarded-for": "  203.0.113.7 , 70.41.3.18" }))).toBe("203.0.113.7");
  });

  it("cai no x-real-ip quando não há cadeia de proxy", () => {
    expect(getClientIp(req({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("prefere x-forwarded-for quando os dois cabeçalhos vêm juntos", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "198.51.100.4" })))
      .toBe("203.0.113.7");
  });

  it("agrupa todo mundo sob 'unknown' quando não dá para identificar a origem", () => {
    // Importante que seja um valor FIXO: assim o limite ainda se aplica em
    // bloco a quem chega sem cabeçalho, em vez de virar chave nova a cada
    // requisição (o que desativaria o rate limit).
    expect(getClientIp(req({}))).toBe("unknown");
    expect(getClientIp(req({}))).toBe(getClientIp(req({})));
  });

  it("cai no x-real-ip quando o x-forwarded-for chega vazio", () => {
    expect(getClientIp(req({ "x-forwarded-for": "", "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("dá chaves diferentes para IPs diferentes na mesma rota", () => {
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7" })))
      .not.toBe(getClientIp(req({ "x-forwarded-for": "203.0.113.8" })));
  });

  it("devolve o cabeçalho como veio, sem validar formato de IP", () => {
    // Documenta o limite atual: x-forwarded-for é enviado pelo cliente e só é
    // confiável porque o proxy da Vercel reescreve o cabeçalho. A função não
    // valida nada — um valor forjado vira chave de rate limit própria.
    expect(getClientIp(req({ "x-forwarded-for": "nao-e-um-ip" }))).toBe("nao-e-um-ip");
  });
});
