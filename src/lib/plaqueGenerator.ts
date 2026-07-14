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

// Brief real por tipo (2026-07-13, v2) — reescrito depois do Leonardo
// mandar exemplos do que espera (posts promocionais tipo Canva: cores
// vibrantes, mascotes, moldura decorativa no QR) vs. o que a v1 do prompt
// gerava (foto de mockup de plaquinha pendurada na parede, realista demais
// e "sem graça" perto da referência).
const PLAQUE_TYPE_BRIEF: Record<PlaqueType, string> = {
  biosite: "convite pra acessar o bio site/perfil digital do negócio — chamada tipo \"ACESSE NOSSO BIOSITE\" ou \"TUDO EM UM SÓ LUGAR\", com ícones de celular/QR/NFC",
  pix: "chamada \"PAGUE COM PIX\" em destaque, usando o verde/turquesa característico do Pix (ou as cores da marca do negócio, se contrastarem bem)",
  wifi: "chamada tipo \"CONECTE-SE AO NOSSO WI-FI\" ou \"WI-FI GRÁTIS\", com ícone de sinal Wi-Fi",
  google_review: "chamada \"NOS AVALIE NO GOOGLE\" com estrelas douradas em destaque e frase de impacto tipo \"Sua opinião faz a diferença\"",
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
    `Crie um design gráfico promocional para uma plaquinha de sinalização digital (formato ${sizeLabel}, proporção retrato).`,
    `Objetivo do design: ${PLAQUE_TYPE_BRIEF[input.plaqueType]}.`,
    `Nome do negócio: "${input.businessName}" — deve aparecer com destaque, tipografia bold e legível, sem erros de escrita ou palavras inventadas.`,
    input.extraInfo ? `Instruções adicionais do cliente (siga à risca): "${input.extraInfo}".` : "",
    input.logoBase64
      ? "Use a logo enviada em anexo: mantenha as MESMAS cores e estilo da logo em toda a composição (não invente uma paleta nova), e inclua a própria logo com destaque no topo do design."
      : "Sem logo enviada — crie uma identidade visual vibrante e coerente baseada no nome e no tipo de negócio.",
    // Estilo-alvo: o v1 gerava foto realista de plaquinha na parede (mockup
    // 3D, sombra, parafusos) — Leonardo quer o design PRONTO, plano, estilo
    // post de Instagram/template de Canva pra pequeno negócio brasileiro.
    "ESTILO OBRIGATÓRIO: design gráfico plano (flat design) igual um post promocional de Instagram ou template do Canva para pequenos negócios — cores vibrantes e saturadas, elementos decorativos (respingos de cor, faixas, formas geométricas, estrelas, fitas), tipografia grande e bold, pode incluir um mascote/personagem ilustrado se combinar com o nicho do negócio (comida, serviço, etc). Composição cheia e viva, não minimalista.",
    "PROIBIDO: não renderize como fotografia de produto, não mostre a plaquinha física pendurada numa parede, sem sombra 3D, sem parafusos, sem perspectiva — a imagem deve ser o PRÓPRIO design final, visto de frente, ocupando o quadro inteiro, pronto pra impressão.",
    "Reserve uma área quadrada, com moldura decorativa nas cores do design (cantos estilo mira de câmera, ou fundo em cartão arredondado) pronta pra receber um QR Code por cima depois — a moldura/decoração ao redor pode (e deve) seguir o estilo do resto do design, mas o MIOLO dessa área precisa ficar completamente liso e neutro (branco ou cor sólida clara), sem nenhum padrão de QR Code, código de barras, ou qualquer desenho dentro dela — só o entorno é decorado.",
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
