import { generateImage } from "ai";
import { google } from "@ai-sdk/google";

// Gerador de arte de plaquinha por IA (2026-07-13) — pedido do Leonardo:
// sobe a logo + preenche informações, a IA cria a arte pronta pra
// impressão na plaquinha física (10x15 ou tamanho custom). Modelo Gemini
// 2.5 Flash Image ("nano banana") — bom custo (~$0,04/imagem) e bom em
// renderizar texto legível dentro da imagem, ponto crítico aqui (nome do
// negócio, instrução de uso).
//
// A IA gera só a ARTE DE FUNDO (logo, cores, composição, texto) com uma
// área reservada em branco pro QR Code — NÃO tenta desenhar um QR Code de
// verdade (IA generativa não garante um QR Code que realmente escaneia).
// O QR Code funcional (já corrigido — ver pixBrCode.ts) é sobreposto
// depois, na fase de edição (Konva — ainda não construída nesta primeira
// entrega). Isso evita entregar uma plaquinha bonita mas com QR Code
// quebrado.
export type PlaqueType = "biosite" | "pix" | "wifi" | "google_review";
export type PlaqueSize = "10x15" | "5x10" | "custom";

const PLAQUE_TYPE_BRIEF: Record<PlaqueType, string> = {
  biosite: "uma plaquinha de identificação com QR Code que leva ao perfil/bio site digital do negócio",
  pix: "uma plaquinha de pagamento via Pix, com QR Code pra pagar direto pelo celular",
  wifi: "uma plaquinha de acesso à rede Wi-Fi do estabelecimento, com QR Code pra conectar automaticamente",
  google_review: "uma plaquinha convidando o cliente a deixar uma avaliação no Google, com QR Code pra abrir a página de avaliação",
};

export type PlaqueGenerationInput = {
  plaqueType: PlaqueType;
  size: PlaqueSize;
  customWidthCm?: number;
  customHeightCm?: number;
  businessName: string;
  extraInfo?: string;
  logoBase64?: string; // base64 puro, sem prefixo "data:image/...;base64,"
  logoMediaType?: string;
};

function buildPrompt(input: PlaqueGenerationInput): string {
  const sizeLabel =
    input.size === "custom" && input.customWidthCm && input.customHeightCm
      ? `${input.customWidthCm}x${input.customHeightCm}cm`
      : input.size === "custom"
        ? "tamanho personalizado"
        : `${input.size}cm`;

  const lines = [
    `Crie a arte de uma plaquinha física de acrílico para ponto de venda, no formato ${sizeLabel} (proporção retrato ou paisagem conforme as dimensões).`,
    `Tipo de plaquinha: ${PLAQUE_TYPE_BRIEF[input.plaqueType]}.`,
    `Nome do negócio: "${input.businessName}" — deve aparecer com destaque, tipografia legível, sem erros de escrita.`,
    input.extraInfo ? `Informação adicional a incluir no design: "${input.extraInfo}".` : "",
    input.logoBase64
      ? "Use a logo enviada em anexo como referência de identidade visual (cores, estilo) e inclua a própria logo na composição."
      : "Sem logo enviada — crie uma composição visual limpa e profissional baseada só no nome do negócio.",
    "Design minimalista, moderno, alto contraste, adequado para impressão em acrílico.",
    "IMPORTANTE: deixe uma área quadrada lisa e neutra (fundo sólido, sem elementos gráficos por cima) reservada no canto inferior ou centro da composição — esse espaço será usado depois para colar um QR Code funcional por fora. Não desenhe nenhum padrão de QR Code ou código de barras na imagem.",
    "Sem texto borrado, sem palavras inventadas ou ilegíveis.",
  ].filter(Boolean);

  return lines.join(" ");
}

export type PlaqueGenerationResult = {
  base64: string;
  mediaType: string;
};

export async function generatePlaqueArt(input: PlaqueGenerationInput): Promise<PlaqueGenerationResult> {
  const prompt = buildPrompt(input);

  const promptPayload = input.logoBase64
    ? { images: [input.logoBase64], text: prompt }
    : prompt;

  const result = await generateImage({
    model: google.image("gemini-2.5-flash-image"),
    prompt: promptPayload,
    aspectRatio: input.size === "5x10" ? "1:2" : "2:3",
  });

  const [image] = result.images;
  if (!image) throw new Error("A IA não retornou nenhuma imagem.");

  return { base64: image.base64, mediaType: image.mediaType };
}
