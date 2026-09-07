// Leituras de analytics além de visitas/cliques (2026-09-07, referência
// Coonexta — documento de análise do concorrente: "origem do tráfego,
// evolução, ranking dos botões, mobile x desktop e taxa de conversão").
// A tabela toqy_analytics_events JÁ grava referer/user_agent desde
// 2026-07-16 (ver /api/analytics/track/route.ts) — o que faltava não era
// coletar mais dado, era CATEGORIZAR o que já existe. Duas funções
// puras, sem I/O, fáceis de testar.

export type TrafficOrigin = "Instagram" | "TikTok" | "YouTube" | "Google" | "WhatsApp" | "Facebook" | "Direto/Outro";

/**
 * Categoriza a origem do tráfego pelo `referer` HTTP. Nulo/vazio = acesso
 * direto (digitou a URL, veio de QR Code impresso, ou o navegador do
 * visitante bloqueia o cabeçalho Referer — os três casos são
 * indistinguíveis a partir daqui, por isso "Direto/Outro" e não só
 * "Direto").
 */
export function categorizeReferer(referer?: string | null): TrafficOrigin {
  if (!referer) return "Direto/Outro";
  let host = "";
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return "Direto/Outro";
  }
  if (host.includes("instagram.com")) return "Instagram";
  if (host.includes("tiktok.com")) return "TikTok";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
  if (host.includes("google.")) return "Google";
  if (host.includes("whatsapp.com") || host.includes("wa.me")) return "WhatsApp";
  if (host.includes("facebook.com") || host.includes("fb.com")) return "Facebook";
  return "Direto/Outro";
}

/**
 * Mobile vs desktop pelo `user_agent`. Heurística padrão de mercado
 * (regex de tokens de plataforma móvel) — não é 100% infalível (nenhuma
 * é, sem Client Hints), mas cobre a esmagadora maioria dos navegadores
 * reais.
 */
export function isMobileUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
}

export const PERIOD_OPTIONS = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "7d", label: "7 dias" },
  { id: "15d", label: "15 dias" },
  { id: "30d", label: "30 dias" },
  { id: "all", label: "Máximo" },
] as const;

export type PeriodId = (typeof PERIOD_OPTIONS)[number]["id"];

/** Início (inclusive) e fim (exclusive) do período, em ISO. */
export function periodRange(period: PeriodId): { from: string; to?: string } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  switch (period) {
    case "today":
      return { from: startOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: startOfDay(now) };
    }
    case "7d":
      return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
    case "15d":
      return { from: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() };
    case "all":
      return { from: new Date(0).toISOString() };
  }
}
