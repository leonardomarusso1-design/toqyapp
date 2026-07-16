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

export type KiwifyAffiliate = {
  affiliate_id: string;
  name?: string;
  email?: string;
  commission?: number;
  status?: string;
  product_id?: string;
  [key: string]: unknown;
};

// Programa de indicação com comissão (2026-07-15) — Kiwify NÃO tem endpoint
// pra CRIAR afiliado por API (só GET /affiliates, GET /affiliates/{id} e
// PUT /affiliates/{id} — confirmado na documentação oficial em
// docs.kiwify.com.br/api-reference/affiliates, 2026-07-15). O revendedor
// precisa se candidatar 1 vez no link público de afiliados do produto na
// própria Kiwify (aprovação automática configurada por Leonardo lá, fora
// deste código) — só DEPOIS disso essa busca por e-mail encontra o
// affiliate_id, usado em setKiwifyAffiliateCommission() abaixo. Ver
// POST /api/resellers/sync-affiliate.
//
// Bugs reais corrigidos (2026-07-16, primeiro teste de verdade contra a API
// — Leonardo se candidatou com uma conta separada, apareceu "ativo" na
// Kiwify, mas sincronizar disse "não encontramos você"): confirmei o
// contrato real contra o openapi.json oficial (docs.kiwify.com.br/
// api-reference/openapi.json — a página HTML de doc é renderizada por JS,
// não dá pra confiar em fetch simples dela). Dois problemas:
// 1. O parâmetro `search` não é documentado como "busca por e-mail" — pode
//    filtrar por nome/empresa e não achar nada por e-mail. Sem page_size
//    explícito, o comportamento de paginação padrão também é incerto. Agora
//    pede page_size alto (100) além do search, pra não depender só dele.
// 2. `?? affiliates[0]` era um bug de verdade: se `search` retornasse
//    afiliados SEM bater o e-mail exato (nome parecido, etc.), o código
//    pegava o primeiro da lista mesmo assim — poderia setar a comissão de
//    30% na conta de OUTRO revendedor por engano. Removido: só retorna em
//    match exato de e-mail, ou null.
// Também loga status+corpo em erro (`!res.ok`), que antes desaparecia em
// silêncio — sem isso não dá pra saber se a causa foi erro de API ou
// simplesmente "nenhum resultado" sem acesso aos logs da Vercel.
export async function findKiwifyAffiliateByEmail(email: string): Promise<KiwifyAffiliate | null> {
  if (!email) return null;

  const token = await getKiwifyToken();
  if (!token) return null;

  const res = await fetch(
    `${KIWIFY_API_BASE}/affiliates?search=${encodeURIComponent(email)}&page_size=100`,
    { headers: { Authorization: `Bearer ${token}`, "x-kiwify-account-id": process.env.KIWIFY_ACCOUNT_ID! } }
  );
  if (!res.ok) {
    console.error("[kiwifyApi] findKiwifyAffiliateByEmail falhou:", res.status, await res.text().catch(() => "(sem corpo)"));
    return null;
  }

  const data = await res.json();
  const affiliates: KiwifyAffiliate[] = data?.data ?? (Array.isArray(data) ? data : []);
  return affiliates.find((a) => a.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

// Ajusta a comissão de um afiliado já existente pro valor do tier dele
// (20% Freelancer / 30% Agência, ver src/lib/resellerTiers.ts).
//
// Formato confirmado 2026-07-16 contra o openapi.json oficial
// (docs.kiwify.com.br/api-reference/openapi.json, schema AffiliateRequest):
// `commission` é number (exemplo 4600 pra 46% — percentual × 100, 2 casas
// decimais fixas, é a interpretação usada aqui) e `status` é enum
// "active" | "blocked" | "refused". Nenhum campo é obrigatório no schema,
// mas mandamos os dois de propósito (reativa o afiliado se estivesse
// bloqueado/recusado, além de ajustar a comissão).
export async function setKiwifyAffiliateCommission(affiliateId: string, commissionPct: number): Promise<boolean> {
  if (!affiliateId) return false;

  const token = await getKiwifyToken();
  if (!token) return false;

  const res = await fetch(`${KIWIFY_API_BASE}/affiliates/${encodeURIComponent(affiliateId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-kiwify-account-id": process.env.KIWIFY_ACCOUNT_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commission: Math.round(commissionPct * 100), status: "active" }),
  });
  if (!res.ok) {
    console.error("[kiwifyApi] setKiwifyAffiliateCommission falhou:", res.status, await res.text().catch(() => "(sem corpo)"));
  }
  return res.ok;
}
