import { describe, it, expect } from "vitest";
import { generatePixBRCode, extractCityFromLocation } from "./pixBrCode";

// Este módulo gera o "Pix Copia e Cola" que o cliente final escaneia para
// PAGAR. Já houve um bug real aqui: o QR Code carregava um texto solto que
// nenhum banco reconhecia — parecia funcionar e não recebia nada. Qualquer
// regressão neste arquivo volta a fazer o negócio deixar de receber, sem
// nenhum erro visível na tela.

// --- Verificação independente do payload ------------------------------------

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, sem XOR final) implementado
// aqui por TABELA — caminho de código diferente do laço bit a bit da
// produção. Ancorado no valor de conferência publicado do algoritmo:
// CRC("123456789") === 0x29B1. Se este teste e a produção divergirem, um dos
// dois está errado e o BR Code seria rejeitado pelo banco.
const CRC_TABLE = (() => {
  const table = new Uint16Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i << 8;
    for (let j = 0; j < 8; j++) c = (c & 0x8000) !== 0 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
    table[i] = c;
  }
  return table;
})();

function crcEsperado(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc = ((crc << 8) ^ CRC_TABLE[((crc >> 8) ^ payload.charCodeAt(i)) & 0xff]) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Parser TLV estrito: se algum campo declarar tamanho errado, ele estoura em
// vez de aceitar em silêncio um payload que o banco recusaria.
function parseTlv(payload: string): Record<string, string> {
  const campos: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const tamanho = Number(payload.slice(i + 2, i + 4));
    if (id.length !== 2 || Number.isNaN(tamanho)) throw new Error(`TLV malformado em ${i}: "${payload.slice(i, i + 4)}"`);
    const valor = payload.slice(i + 4, i + 4 + tamanho);
    if (valor.length !== tamanho) throw new Error(`Campo ${id} declara ${tamanho} mas tem ${valor.length}`);
    campos[id] = valor;
    i += 4 + tamanho;
  }
  return campos;
}

const BASE = { key: "19999999999", merchantName: "Barbearia do Ze", city: "Indaiatuba" };

describe("verificação do próprio teste", () => {
  it("reproduz o valor de conferência publicado do CRC-16/CCITT-FALSE", () => {
    expect(crcEsperado("123456789")).toBe("29B1");
  });
});

describe("generatePixBRCode — estrutura EMV", () => {
  it("gera um payload TLV inteiro e bem formado", () => {
    expect(() => parseTlv(generatePixBRCode(BASE))).not.toThrow();
  });

  it("preenche os campos obrigatórios do padrão do Banco Central", () => {
    const campos = parseTlv(generatePixBRCode(BASE));
    expect(campos["00"]).toBe("01"); // Payload Format Indicator
    expect(campos["52"]).toBe("0000"); // Merchant Category Code genérico
    expect(campos["53"]).toBe("986"); // moeda BRL
    expect(campos["58"]).toBe("BR"); // país
    expect(campos["63"]).toMatch(/^[0-9A-F]{4}$/); // CRC
  });

  it("fecha o payload com o CRC correto dos campos anteriores", () => {
    const payload = generatePixBRCode(BASE);
    const semCrc = payload.slice(0, -4);
    expect(semCrc.endsWith("6304")).toBe(true);
    expect(payload.slice(-4)).toBe(crcEsperado(semCrc));
  });

  it("muda o CRC quando qualquer dado do pagamento muda", () => {
    const a = generatePixBRCode(BASE);
    const b = generatePixBRCode({ ...BASE, key: "11888888888" });
    expect(a.slice(-4)).not.toBe(b.slice(-4));
  });

  it("declara a chave Pix exatamente como o recebedor cadastrou", () => {
    // A chave NÃO passa pelo sanitize (que remove @, +, ponto e acento e
    // deixa maiúsculo) — se passasse, toda chave de e-mail ou telefone com
    // "+" viraria uma chave inexistente e o pagamento cairia em lugar nenhum.
    const email = "Contato@Toqy.com.br";
    const conta = parseTlv(generatePixBRCode({ ...BASE, key: email }))["26"];
    const sub = parseTlv(conta);
    expect(sub["00"]).toBe("br.gov.bcb.pix");
    expect(sub["01"]).toBe(email);
  });

  it("preserva chave aleatória (UUID) e chave de telefone com +55", () => {
    const uuid = "123e4567-e89b-12d3-a456-426655440000";
    expect(parseTlv(parseTlv(generatePixBRCode({ ...BASE, key: uuid }))["26"])["01"]).toBe(uuid);
    const tel = "+5519999999999";
    expect(parseTlv(parseTlv(generatePixBRCode({ ...BASE, key: tel }))["26"])["01"]).toBe(tel);
  });

  it("tira espaço em volta da chave colada pelo usuário", () => {
    const conta = parseTlv(generatePixBRCode({ ...BASE, key: "  19999999999  " }))["26"];
    expect(parseTlv(conta)["01"]).toBe("19999999999");
  });
});

describe("generatePixBRCode — valor da cobrança", () => {
  it("omite o valor quando não informado, deixando quem paga digitar", () => {
    expect(parseTlv(generatePixBRCode(BASE))["54"]).toBeUndefined();
  });

  it("grava o valor com duas casas quando informado", () => {
    expect(parseTlv(generatePixBRCode({ ...BASE, amount: 10 }))["54"]).toBe("10.00");
    expect(parseTlv(generatePixBRCode({ ...BASE, amount: 1234.5 }))["54"]).toBe("1234.50");
  });

  it("arredonda para centavos em vez de gerar um valor inválido", () => {
    expect(parseTlv(generatePixBRCode({ ...BASE, amount: 10.999 }))["54"]).toBe("11.00");
  });

  it("ignora valor zero ou negativo em vez de cobrar errado", () => {
    expect(parseTlv(generatePixBRCode({ ...BASE, amount: 0 }))["54"]).toBeUndefined();
    expect(parseTlv(generatePixBRCode({ ...BASE, amount: -50 }))["54"]).toBeUndefined();
  });
});

describe("generatePixBRCode — nome do recebedor e cidade", () => {
  it("remove acento e caractere especial que fariam o banco recusar o código", () => {
    const campos = parseTlv(generatePixBRCode({ ...BASE, merchantName: "Açaí & Cia. Ltda", city: "São Paulo" }));
    expect(campos["59"]).toBe("ACAI  CIA LTDA");
    expect(campos["60"]).toBe("SAO PAULO");
  });

  it("respeita o limite de 25 caracteres do nome e 15 da cidade", () => {
    const campos = parseTlv(generatePixBRCode({
      ...BASE,
      merchantName: "Restaurante Muito Grande Do Seu Joao",
      city: "Cidade Muito Grande Demais",
    }));
    expect(campos["59"].length).toBeLessThanOrEqual(25);
    expect(campos["60"].length).toBeLessThanOrEqual(15);
  });

  it("usa um recebedor genérico quando não sobra nada do nome", () => {
    expect(parseTlv(generatePixBRCode({ ...BASE, merchantName: "🍔🍟" }))["59"]).toBe("RECEBEDOR");
    expect(parseTlv(generatePixBRCode({ ...BASE, merchantName: "" }))["59"]).toBe("RECEBEDOR");
  });

  it("usa BRASIL quando não sobra nada da cidade", () => {
    expect(parseTlv(generatePixBRCode({ ...BASE, city: "" }))["60"]).toBe("BRASIL");
    expect(parseTlv(generatePixBRCode({ ...BASE, city: "---" }))["60"]).toBe("BRASIL");
  });
});

describe("generatePixBRCode — identificador da transação", () => {
  it("usa *** quando não há referência específica", () => {
    expect(parseTlv(parseTlv(generatePixBRCode(BASE))["62"])["05"]).toBe("***");
  });

  it("higieniza o txid informado", () => {
    const extra = parseTlv(generatePixBRCode({ ...BASE, txid: "Pedido #42" }))["62"];
    expect(parseTlv(extra)["05"]).toBe("PEDIDO 42");
  });
});

describe("extractCityFromLocation", () => {
  it("pega a cidade do último trecho do endereço livre", () => {
    expect(extractCityFromLocation("Jd. Bom Princípio, Indaiatuba")).toBe("INDAIATUBA");
    expect(extractCityFromLocation("Rua das Flores 123, Centro, Campinas")).toBe("CAMPINAS");
  });

  it("aceita endereço com só a cidade", () => {
    expect(extractCityFromLocation("São Paulo")).toBe("SAO PAULO");
  });

  it("cai em BRASIL quando o negócio não cadastrou endereço", () => {
    expect(extractCityFromLocation("")).toBe("BRASIL");
    expect(extractCityFromLocation("   ")).toBe("BRASIL");
    expect(extractCityFromLocation(",,,")).toBe("BRASIL");
  });

  it("ignora vírgula sobrando no fim do endereço", () => {
    expect(extractCityFromLocation("Centro, Indaiatuba,")).toBe("INDAIATUBA");
  });
});
