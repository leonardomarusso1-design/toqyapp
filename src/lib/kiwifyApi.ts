// Client de saída pra API pública da Kiwify — Fase 2 do roadmap (Revenue
// Share, 2026-07-16). Não existia nenhuma chamada de saída pra Kiwify antes
// disso (só recebíamos webhook). Usado pra descobrir, por venda, qual
// afiliado (revendedor) recebeu comissão — ver .planning/ROADMAP.md Phase 2.
//
// Auth: OAuth2 client-credentials (POST /oauth/token com client_id +
// client_secret, criados em Apps > API no painel Kiwify). Token válido 96h.
//
// Nota sobre o cache do token em ambiente serverless (Vercel): a variável de
// módulo abaixo só persiste enquanto a instância da função fica "quente" —
// cold starts reemitem o token. Com 1 chamada por order_approved, isso não é
// um problema de limite de taxa, só significa que "cachear e reusar" é
// aproximado, não garantido entre invocações frias. Não vale a pena resolver
// isso agora (persistir em tabela/KV seria over-engineering pro volume
// esperado).

const KIWIFY_API_BASE = "https://public-api.kiwify.com/v1";

// Margem de segurança sobre as 96h reais de validade do token.
const TOKEN_TTL_MS = 95 * 60 * 60 * 1000;

let cachedToken: { token: string; expiresAt: number } | null = null;

export function hasKiwifyApiEnv() {
  return Boolean(
    process.env.KIWIFY_CLIENT_ID &&
    process.env.KIWIFY_CLIENT_SECRET &&
    process.env.KIWIFY_ACCOUNT_ID
  );
}

async function getKiwifyToken(): Promise<string | null> {
  if (!hasKiwifyApiEnv()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch(`${KIWIFY_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.KIWIFY_CLIENT_ID,
      client_secret: process.env.KIWIFY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.access_token) return null;

  cachedToken = { token: data.access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return cachedToken.token;
}

export type KiwifyAffiliateCommission = {
  id?: string;
  name?: string;
  document?: string;
  email?: string;
  amount?: number;
};

export type KiwifySaleDetail = {
  id: string;
  amount?: number;
  affiliate_commission?: KiwifyAffiliateCommission;
  revenue_partners?: Array<{ name?: string; email?: string; percentage?: number; amount?: number }>;
  [key: string]: unknown;
};

// Busca o detalhe de uma venda (inclui affiliate_commission, se houve
// afiliado atribuído) — usado no webhook pra montar o ledger de comissão.
// Retorna null em qualquer falha (env não configurada, chamada falhou,
// venda não encontrada) — chamador nunca deve deixar isso quebrar o
// processamento do webhook (a concessão de plano já aconteceu antes).
export async function getKiwifySale(orderId: string): Promise<KiwifySaleDetail | null> {
  if (!orderId) return null;

  const token = await getKiwifyToken();
  if (!token) return null;

  const res = await fetch(
    `${KIWIFY_API_BASE}/sales/${encodeURIComponent(orderId)}?account_id=${encodeURIComponent(process.env.KIWIFY_ACCOUNT_ID!)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;

  return res.json();
}
