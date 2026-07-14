import { generateImage } from "ai";
import { google } from "@ai-sdk/google";

// Gerador de arte de plaquinha por IA — pedido do Leonardo: sobe a logo +
// preenche informações, a IA cria a arte pronta pra impressão na
// plaquinha física (10x15 ou tamanho custom). Modelo Gemini 2.5 Flash
// Image ("nano banana") — bom custo (~$0,04/imagem) e bom em renderizar
// texto legível dentro da imagem.
//
// A IA gera só a ARTE DE FUNDO (logo, cores, composição, texto) com uma
// área reservada pro QR Code — NÃO tenta desenhar um QR Code de verdade
// (IA generativa não garante um QR Code que realmente escaneia). O QR
// Code funcional (já corrigido — ver pixBrCode.ts) é sobreposto depois,
// na fase de edição (Konva — ainda não construída nesta primeira
// entrega). Isso evita entregar uma plaquinha bonita mas com QR Code
// quebrado.
//
// Prompt reescrito (v3, 2026-07-13) em cima do "prompt mental" real que o
// Leonardo já usa manualmente no ChatGPT pra gerar essas plaquinhas pros
// clientes de verdade (premium/clean/corporativo — as duas primeiras
// versões miraram "vibrante estilo Canva" a partir de referências
// visuais que acabaram sendo o alvo errado; esta versão segue o brief
// literal dele, que é o que já funciona na prática).
export type PlaqueType = "biosite" | "pix" | "wifi" | "google_review";
export type PlaqueSize = "10x15" | "5x10" | "custom";

export type PlaqueGenerationInput = {
  plaqueType: PlaqueType;
  size: PlaqueSize;
  customWidthCm?: number;
  customHeightCm?: number;
  businessName: string;
  extraInfo?: string;
  logoBase64?: string; // base64 puro, sem prefixo "data:image/...;base64,"
  logoMediaType?: string;
  // Campos específicos por tipo (2026-07-13) — o prompt do Leonardo pede
  // dado estruturado (favorecido/chave Pix, rede/senha Wi-Fi) em vez de só
  // texto livre em extraInfo, pra ficar consistente entre gerações.
  pixReceiverName?: string;
  pixKeyText?: string;
  wifiNetworkName?: string;
  wifiPasswordText?: string;
};

const TYPE_ADDENDUM: Record<PlaqueType, (input: PlaqueGenerationInput) => string> = {
  pix: (input) =>
    `Título principal (texto curto): "Pague com PIX".` +
    (input.pixReceiverName ? ` Nome do favorecido (texto pequeno): "${input.pixReceiverName}".` : "") +
    (input.pixKeyText ? ` Chave Pix, como texto pequeno (não precisa ser um QR real): "${input.pixKeyText}".` : ""),
  biosite: () =>
    `Título principal (texto curto): "Acesse nosso BioSite". Frase de impacto (texto curto): "Tudo em um só lugar".`,
  google_review: () =>
    `Título principal (texto curto): "Nos avalie no Google", com estrelas ao lado. Frase de impacto (texto curto): "Sua opinião importa".`,
  wifi: (input) =>
    `Título principal (texto curto): "Conecte-se ao Wi-Fi".` +
    (input.wifiNetworkName ? ` Nome da rede, como texto pequeno: "${input.wifiNetworkName}".` : "") +
    (input.wifiPasswordText ? ` Senha, como texto pequeno: "${input.wifiPasswordText}".` : ""),
};

function buildPrompt(input: PlaqueGenerationInput): string {
  const sizeLabel =
    input.size === "custom" && input.customWidthCm && input.customHeightCm
      ? `${input.customWidthCm}x${input.customHeightCm}cm`
      : input.size === "custom"
        ? "tamanho personalizado"
        : `${input.size}cm`;

  const lines = [
    // Formato — framing 100% POSITIVO de propósito (2026-07-13, v4): testado
    // 3 vezes com "NÃO criar mockup / sem perspectiva / sem sombra 3D / sem
    // parafusos" e o modelo insistia em renderizar foto de produto pendurado
    // na parede mesmo assim — instrução negativa é pouco confiável em
    // geração de imagem (o modelo "vê" o conceito citado, independente do
    // "não" na frente). Resolvido descrevendo só o que É: um pôster gráfico
    // digital plano, sem mencionar "acrílico"/"placa" como substantivo
    // principal logo de cara (isso empurrava a associação com produto
    // físico) — o uso final em acrílico vira só uma nota técnica no final.
    `Crie um PÔSTER GRÁFICO DIGITAL plano (flat design, 2D), visto perfeitamente de frente, ocupando 100% da imagem, cantos retos — é a arte final em si, como se fosse aberta direto no Photoshop/Illustrator, pronta pra exportar. Proporção retrato (${sizeLabel}), resolução alta.`,

    // Identidade visual
    input.logoBase64
      ? `Analise cuidadosamente a logo enviada em anexo. Mantenha EXATAMENTE as mesmas cores, a mesma identidade visual e a mesma tipografia da marca — não redesenhe a logo, não altere suas proporções, não mude suas cores. Todo o restante da arte deve seguir essa identidade visual.`
      : `Sem logo enviada — crie uma identidade visual elegante e coerente baseada só no nome do negócio (ex: azul-marinho e dourado, ou outra combinação sóbria e premium).`,

    // Nome do negócio — texto curto de propósito, reduz chance de erro de
    // ortografia (limitação conhecida de geração de imagem com texto em
    // português: frases longas erram letra com mais frequência).
    `Nome do negócio: "${input.businessName}" — escreva em letras GRANDES, bold, espaçamento generoso entre letras.`,
    `IMPORTANTE sobre texto: use só frases CURTAS e palavras comuns em português em qualquer texto que aparecer na arte — isso reduz erro de ortografia. Revise cada palavra escrita antes de finalizar.`,

    // Background
    `Fundo elegante usando SOMENTE as cores da marca (ou tons neutros elegantes se não houver logo) — pode usar formas orgânicas suaves (blobs), gradientes discretos, curvas modernas. Nunca um fundo poluído.`,

    // Estilo
    `ESTILO: premium, clean, minimalista, elegante, corporativo, alta legibilidade, bastante espaço em branco ("respiro") entre elementos, hierarquia visual muito bem definida. Deve parecer uma peça criada por um designer profissional especializado em identidade visual — não um template genérico.`,

    // Organização em blocos
    `Organize a composição em blocos, de cima para baixo, sempre nesta ordem: logo/nome → título principal (texto curto) → frase de impacto (texto curto) → área principal (QR Code + NFC) → informações complementares → rodapé com ícones. Tudo perfeitamente alinhado.`,

    // QR Code
    `Na área principal, reserve um quadrado branco liso à esquerda ou centro, ocupando cerca de 30-40% da área útil, completamente vazio por dentro (sem nenhum padrão, ícone ou desenho ali) — esse espaço vai receber um QR Code real por cima depois, fora desta geração.`,

    // NFC
    `Ao lado do quadrado (visualmente separado, nunca sobrepondo), coloque um ícone moderno de NFC com uma instrução curta (ex: "Aproxime o celular", "Toque para acessar").`,

    // Tipografia, cores, ícones, acabamento
    `Tipografia: poucas fontes, hierarquia clara, títulos fortes, textos leves, espaçamento refinado. Cores: só a paleta da marca (ou a escolhida acima), tons derivados dela, e neutros elegantes. Ícones: minimalistas, mesmo estilo e peso entre si. Acabamento: sombras suaves, gradientes discretos, sem exageros.`,

    // Específico por tipo
    TYPE_ADDENDUM[input.plaqueType](input),

    input.extraInfo ? `Instruções adicionais do cliente (siga à risca): "${input.extraInfo}".` : "",

    // Nota técnica de uso final — só menciona acrílico/impressão aqui, no
    // fim, desacoplado da descrição visual da imagem em si.
    `Nota: esta arte será impressa depois em alta resolução (300 DPI) numa placa de acrílico física — mas a imagem que você gera agora é só o design digital plano, nunca uma fotografia ou renderização 3D do objeto físico.`,
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
