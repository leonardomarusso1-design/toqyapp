import sharp from "sharp";

// Numeração discreta sequencial (2026-07-14, pedido do Leonardo) — carimba
// um número pequeno no canto de toda arte gerada, pra rastrear/gerenciar
// peças físicas individualmente (ex: reimpressão de uma placa específica,
// identificar qual QR pertence a qual cliente/versão). Inspirado num
// concorrente (Vision Local / app LocalScore) que faz o mesmo: número
// discreto impresso na placa física, ligado a um registro individual no
// painel — cada plaquinha rastreável e reimprimível sem confundir com
// outra.
//
// Compõe via SVG + sharp (não pede pra IA desenhar o número) — geração de
// imagem por IA é pouco confiável pra texto pequeno/legível (mesmo
// problema já visto com nome do negócio em fontes longas), então o número
// é carimbado depois, de forma determinística e sempre legível.
export async function stampSeqNumber(imageBuffer: Buffer, seqNumber: number): Promise<Buffer> {
  const label = `#${String(seqNumber).padStart(3, "0")}`;
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1536;

  const fontSize = Math.max(16, Math.round(width * 0.022));
  const paddingX = Math.round(fontSize * 0.7);
  const paddingY = Math.round(fontSize * 0.45);
  const pillWidth = Math.round(fontSize * 0.62 * label.length + paddingX * 2);
  const pillHeight = Math.round(fontSize + paddingY * 2);
  const margin = Math.round(width * 0.025);

  const svg = `
    <svg width="${pillWidth}" height="${pillHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="black" fill-opacity="0.38" />
      <text x="${pillWidth / 2}" y="${pillHeight / 2}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" fill-opacity="0.85" text-anchor="middle" dominant-baseline="central">${label}</text>
    </svg>
  `;

  return sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svg),
        left: Math.max(0, width - pillWidth - margin),
        top: Math.max(0, height - pillHeight - margin),
      },
    ])
    .png()
    .toBuffer();
}
