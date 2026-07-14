// Gerador de "Pix Copia e Cola" / BR Code (EMV QRCPS-MPM) — padrão oficial
// do Banco Central pra QR Code de Pix estático.
//
// Bug real corrigido em 2026-07-13 (Leonardo): o QR Code de Pix do Toqy
// (PublicBioSite.tsx PixModal + PixHub.tsx) usava um texto solto tipo
// "PIX chave | recebedor" — isso NÃO é um Pix de verdade. Nenhum app de
// banco reconhece esse formato como pagamento; a pessoa via um QR Code que
// parecia funcionar mas não fazia nada ao escanear. O formato real
// (documentado pelo BCB, "Manual de Padrões para Iniciação do Pix") é uma
// sequência de campos TLV (tag-length-value) terminando num CRC16.
//
// Referência de campos:
//   00 Payload Format Indicator (sempre "01")
//   26 Merchant Account Information (GUI br.gov.bcb.pix + chave + descrição)
//   52 Merchant Category Code ("0000" = genérico)
//   53 Transaction Currency ("986" = BRL)
//   54 Transaction Amount (opcional — se ausente, quem paga digita o valor)
//   58 Country Code ("BR")
//   59 Merchant Name (até 25 chars, sem acento/especial)
//   60 Merchant City (até 15 chars, sem acento/especial)
//   62 Additional Data Field Template (txid — "***" = sem referência específica)
//   63 CRC16 (checksum dos campos anteriores, sempre por último)

function tlv(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, sem XOR final) — exigido
// pelo padrão EMV QR Code que o Pix usa. Confirmado contra geradores de
// referência do mercado (mesmo algoritmo usado por qualquer BR Code válido).
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Merchant name/city precisam ser ASCII simples (sem acento, sem caractere
// especial) por especificação — bancos rejeitam o BR Code inteiro se vier
// com acentuação nesses campos.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

function sanitize(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "") // remove acentos (combining marks pós-NFD)
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}

// Heurística pra extrair "cidade" de um campo de endereço livre (Toqy não
// tem campo dedicado de cidade) — pega o último segmento separado por
// vírgula (ex: "Jd. Bom Princípio, Indaiatuba" -> "Indaiatuba"). Sem
// endereço, cai em "BRASIL" (fallback aceito por validadores de Pix quando
// a cidade real é desconhecida).
export function extractCityFromLocation(location: string): string {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  const city = parts[parts.length - 1] || "";
  return sanitize(city, 15) || "BRASIL";
}

export function generatePixBRCode(params: {
  key: string;
  merchantName: string;
  city: string;
  amount?: number;
  txid?: string;
}): string {
  const { key, merchantName, city, amount, txid } = params;

  const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", key.trim());

  const additionalData = tlv("05", txid ? sanitize(txid, 25) : "***");

  let payload =
    tlv("00", "01") +
    tlv("26", merchantAccountInfo) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (amount && amount > 0 ? tlv("54", amount.toFixed(2)) : "") +
    tlv("58", "BR") +
    tlv("59", sanitize(merchantName, 25) || "RECEBEDOR") +
    tlv("60", sanitize(city, 15) || "BRASIL") +
    tlv("62", additionalData);

  payload += "6304"; // ID + tamanho do CRC, fixo — precisa estar presente ANTES de calcular o CRC
  return payload + crc16(payload);
}
