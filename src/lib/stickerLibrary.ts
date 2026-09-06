// Banco de figurinhas do Toqy (2026-09-06, pedido do Leonardo: "figurinhas
// tem que ser igual do Linktree, tipo WhatsApp"). Os stickers ilustrados
// reais do Linktree/WhatsApp são arte com direito autoral de cada empresa
// — não dá pra clonar. Decisão confirmada com o Leonardo: banco próprio de
// emojis grandes + formas decorativas simples, sem risco nenhum de
// direito autoral, cobrindo o mesmo efeito ("dar personalidade ao bio
// site"). Cada entrada tem uma `key` estável (é isso que fica salvo em
// `site.stickers[].key` — nunca o emoji/SVG em si, pra poder trocar o
// banco no futuro sem migrar dado nenhum).

export type StickerDef = { key: string; label: string; kind: "emoji" | "shape"; emoji?: string };

export const STICKER_LIBRARY: StickerDef[] = [
  // Emojis grandes — renderizados como texto puro (zero asset, zero peso)
  { key: "sparkles", label: "Brilho", kind: "emoji", emoji: "✨" },
  { key: "fire", label: "Fogo", kind: "emoji", emoji: "🔥" },
  { key: "heart", label: "Coração", kind: "emoji", emoji: "❤️" },
  { key: "star", label: "Estrela", kind: "emoji", emoji: "⭐" },
  { key: "party", label: "Festa", kind: "emoji", emoji: "🎉" },
  { key: "100", label: "100", kind: "emoji", emoji: "💯" },
  { key: "crown", label: "Coroa", kind: "emoji", emoji: "👑" },
  { key: "rocket", label: "Foguete", kind: "emoji", emoji: "🚀" },
  { key: "thumbsup", label: "Joinha", kind: "emoji", emoji: "👍" },
  { key: "eyes", label: "Olhos", kind: "emoji", emoji: "👀" },
  { key: "check", label: "Check", kind: "emoji", emoji: "✅" },
  { key: "new", label: "Novo", kind: "emoji", emoji: "🆕" },
  { key: "gem", label: "Diamante", kind: "emoji", emoji: "💎" },
  { key: "sun", label: "Sol", kind: "emoji", emoji: "☀️" },
  { key: "moon", label: "Lua", kind: "emoji", emoji: "🌙" },
  { key: "flower", label: "Flor", kind: "emoji", emoji: "🌸" },
  { key: "leaf", label: "Folha", kind: "emoji", emoji: "🍃" },
  { key: "coffee", label: "Café", kind: "emoji", emoji: "☕" },
  { key: "bell", label: "Sino", kind: "emoji", emoji: "🔔" },
  { key: "gift", label: "Presente", kind: "emoji", emoji: "🎁" },
  { key: "target", label: "Alvo", kind: "emoji", emoji: "🎯" },
  { key: "clap", label: "Palma", kind: "emoji", emoji: "👏" },
  { key: "lightning", label: "Raio", kind: "emoji", emoji: "⚡" },
  { key: "medal", label: "Medalha", kind: "emoji", emoji: "🏅" },
  // Formas soltas — SVG inline simples (sem asset externo), ver StickerIcon
  { key: "shape-burst", label: "Estouro", kind: "shape" },
  { key: "shape-scribble", label: "Rabisco", kind: "shape" },
  { key: "shape-ring", label: "Anel", kind: "shape" },
  { key: "shape-blob", label: "Mancha", kind: "shape" },
  { key: "shape-arrow-curve", label: "Seta curva", kind: "shape" },
  { key: "shape-dots", label: "Pontinhos", kind: "shape" },
];

export function getStickerDef(key: string): StickerDef | undefined {
  return STICKER_LIBRARY.find((s) => s.key === key);
}
