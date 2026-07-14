// Gerador de arte de plaquinha por IA — pedido do Leonardo: sobe a logo +
// preenche informações, a IA cria a arte pronta pra impressão na
// plaquinha física (10x15 ou tamanho custom).
//
// A IA gera só a ARTE DE FUNDO (logo, cores, composição, texto) com uma
// área reservada pro QR Code — NÃO tenta desenhar um QR Code de verdade
// (IA generativa não garante um QR Code que realmente escaneia). O QR
// Code funcional é sobreposto depois, na fase de edição (Konva — ainda
// não construída nesta primeira entrega). Isso evita entregar uma
// plaquinha bonita mas com QR Code quebrado.
//
// Modelo trocado de Gemini 2.5 Flash Image pra OpenAI gpt-image-2
// (2026-07-14, pedido do Leonardo): testado 4 iterações de prompt em cima
// do Gemini e o resultado continuou "sem sal, não puxa ícones" segundo o
// próprio Leonardo — o mesmo texto/prompt que ele usa manualmente no
// ChatGPT (que roda gpt-image-2 desde o rebrand "ChatGPT Images 2.0",
// abr/2026) produz resultado muito melhor. gpt-image-2 também resolve o
// problema de texto em português mal renderizado (texto ~99% de acerto
// vs Gemini, que errava letra com frequência em frases mais longas).
//
// Usa a API de imagens da OpenAI DIRETO via fetch (não via `generateImage`
// do AI SDK) porque o AI SDK não expõe input de imagem de referência pro
// provider OpenAI — só texto->imagem. Pra manter a logo do cliente como
// referência real (mesmas cores/identidade, não redesenhada do zero),
// isso exige o endpoint /v1/images/edits (image-to-image), que só existe
// como chamada REST crua por enquanto.
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
    `Crie um PÔSTER GRÁFICO DIGITAL plano (flat design, 2D), visto perfeitamente de frente, ocupando 100% da imagem, cantos retos — é a arte final em si, como se fosse aberta direto no Photoshop/Illustrator, pronta pra exportar. Proporção retrato (${sizeLabel}), resolução alta.`,

    input.logoBase64
      ? `Analise cuidadosamente a logo enviada em anexo. Mantenha EXATAMENTE as mesmas cores, a mesma identidade visual e a mesma tipografia da marca — não redesenhe a logo, não altere suas proporções, não mude suas cores. Todo o restante da arte deve seguir essa identidade visual.`
      : `Sem logo enviada — crie uma identidade visual elegante e coerente baseada só no nome do negócio (ex: azul-marinho e dourado, ou outra combinação sóbria e premium).`,

    `Nome do negócio: "${input.businessName}" — escreva em letras GRANDES, bold, espaçamento generoso entre letras.`,
    `IMPORTANTE sobre texto: use só frases CURTAS e palavras comuns em português em qualquer texto que aparecer na arte — isso reduz erro de ortografia. Revise cada palavra escrita antes de finalizar.`,

    `Fundo elegante usando SOMENTE as cores da marca (ou tons neutros elegantes se não houver logo) — pode usar formas orgânicas suaves (blobs), gradientes discretos, curvas modernas. Nunca um fundo poluído.`,

    `ESTILO: premium, clean, minimalista, elegante, corporativo, alta legibilidade, bastante espaço em branco ("respiro") entre elementos, hierarquia visual muito bem definida, com ícones e elementos gráficos de apoio bem desenhados (nada de composição vazia ou genérica). Deve parecer uma peça criada por um designer profissional especializado em identidade visual — não um template genérico.`,

    `Organize a composição em blocos, de cima para baixo, sempre nesta ordem: logo/nome → título principal (texto curto) → frase de impacto (texto curto) → área principal (QR Code + NFC) → informações complementares → rodapé com ícones. Tudo perfeitamente alinhado.`,

    `Na área principal, reserve um quadrado branco liso à esquerda ou centro, ocupando cerca de 30-40% da área útil, completamente vazio por dentro (sem nenhum padrão, ícone ou desenho ali) — esse espaço vai receber um QR Code real por cima depois, fora desta geração.`,

    `Ao lado do quadrado (visualmente separado, nunca sobrepondo), coloque um ícone moderno de NFC com uma instrução curta (ex: "Aproxime o celular", "Toque para acessar").`,

    `Tipografia: poucas fontes, hierarquia clara, títulos fortes, textos leves, espaçamento refinado. Cores: só a paleta da marca (ou a escolhida acima), tons derivados dela, e neutros elegantes. Ícones: minimalistas, mesmo estilo e peso entre si, bem desenhados e nítidos. Acabamento: sombras suaves, gradientes discretos, sem exageros.`,

    TYPE_ADDENDUM[input.plaqueType](input),

    input.extraInfo ? `Instruções adicionais do cliente (siga à risca): "${input.extraInfo}".` : "",

    `Nota: esta arte será impressa depois em alta resolução (300 DPI) numa placa de acrílico física — mas a imagem que você gera agora é só o design digital plano, nunca uma fotografia ou renderização 3D do objeto físico.`,
  ].filter(Boolean);

  return lines.join(" ");
}

export type PlaqueGenerationResult = {
  base64: string;
  mediaType: string;
};

const OPENAI_IMAGE_MODEL = "gpt-image-2";

export async function generatePlaqueArt(input: PlaqueGenerationInput): Promise<PlaqueGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada no servidor.");

  const prompt = buildPrompt(input);
  const size = input.size === "5x10" ? "1024x1536" : "1024x1536"; // retrato — os dois tamanhos de plaquinha suportados hoje são verticais

  let response: Response;
  if (input.logoBase64 && input.logoMediaType) {
    // Com logo: usa o endpoint de EDIÇÃO (image-to-image), passando a logo
    // como referência real — é o único jeito de manter cor/identidade
    // exatas em vez de a IA "reinventar" a marca a partir só de texto.
    const logoBuffer = Buffer.from(input.logoBase64, "base64");
    const ext = input.logoMediaType.split("/")[1] || "png";
    const form = new FormData();
    form.append("model", OPENAI_IMAGE_MODEL);
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("quality", "high");
    form.append("image", new Blob([logoBuffer], { type: input.logoMediaType }), `logo.${ext}`);

    response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } else {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size,
        quality: "high",
      }),
    });
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`OpenAI recusou a geração da imagem (${response.status}): ${errorBody.slice(0, 500)}`);
  }

  const json = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("A IA não retornou nenhuma imagem.");

  return { base64: b64, mediaType: "image/png" };
}
