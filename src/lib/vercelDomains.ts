/**
 * Integração com a API da Vercel pra domínio próprio (feature Agência,
 * 2026-09-05). Fonte única de verdade pra add/verificar/remover domínio do
 * projeto na Vercel — nunca chamar a API da Vercel direto de uma rota.
 *
 * Requer 3 env vars (ver .env.example):
 *   VERCEL_API_TOKEN  — token pessoal/de time com acesso ao projeto do toqyapp
 *   VERCEL_PROJECT_ID — id do projeto na Vercel (prj_...)
 *   VERCEL_TEAM_ID    — opcional, só se o projeto vive dentro de um time
 *
 * Docs: https://vercel.com/docs/rest-api/reference/endpoints/domains
 */

const VERCEL_API_BASE = "https://api.vercel.com";

function hasVercelEnv() {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" };
}

export type VercelDomainResult =
  | { ok: true; verified: boolean; verification?: Array<{ type: string; domain: string; value: string; reason?: string }> }
  | { ok: false; error: string };

/**
 * Adiciona um domínio ao projeto na Vercel. Idempotente: se o domínio já
 * está no projeto, a Vercel retorna 200 de novo (não dá erro).
 */
export async function addDomainToVercelProject(domain: string): Promise<VercelDomainResult> {
  if (!hasVercelEnv()) return { ok: false, error: "Integração com a Vercel não configurada no servidor (faltam VERCEL_API_TOKEN/VERCEL_PROJECT_ID)." };

  const res = await fetch(`${VERCEL_API_BASE}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains${teamQuery()}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name: domain }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Domínio já pertence a outro projeto/conta é o erro mais comum aqui.
    const message = body?.error?.message || `Vercel recusou o domínio (HTTP ${res.status})`;
    return { ok: false, error: message };
  }

  return await checkDomainVerification(domain);
}

/**
 * Consulta o status de verificação (CNAME configurado?) de um domínio já
 * adicionado ao projeto. Chamado tanto logo após adicionar quanto depois,
 * quando o usuário clica em "Verificar" no painel.
 */
export async function checkDomainVerification(domain: string): Promise<VercelDomainResult> {
  if (!hasVercelEnv()) return { ok: false, error: "Integração com a Vercel não configurada no servidor." };

  const res = await fetch(`${VERCEL_API_BASE}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${teamQuery()}`, {
    method: "GET",
    headers: authHeaders(),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body?.error?.message || `Erro ao consultar domínio (HTTP ${res.status})` };

  // Bug real corrigido (2026-09-05, achado ao vivo pelo Leonardo testando
  // com yakisabor.com.br — domínio sem NENHUM DNS configurado, dando
  // DNS_PROBE_FINISHED_NXDOMAIN no navegador, mas o painel mostrava
  // "Conectado e servindo o bio site"). Causa: `verified` usava OR entre
  // `body.verified` (flag de OWNERSHIP da Vercel — uma vez confirmada,
  // NÃO volta a false sozinha se o DNS for removido depois) e
  // `!misconfigured` (config atual de verdade). Um domínio que já teve
  // ownership verificado no passado (em outro projeto/deploy, às vezes
  // anos atrás) mantinha `verified:true` pra sempre, mesmo com o CNAME
  // removido ou o domínio nem existindo mais de verdade. Agora exige os
  // DOIS ao mesmo tempo (AND): ownership confirmada E configuração de DNS
  // atual batendo — só assim o bio site está de fato no ar nesse domínio.
  const configRes = await fetch(`${VERCEL_API_BASE}/v6/domains/${encodeURIComponent(domain)}/config${teamQuery()}`, {
    method: "GET",
    headers: authHeaders(),
  });
  const configBody = await configRes.json().catch(() => ({}));
  const dnsConfigured = configBody?.misconfigured === false; // só true quando a Vercel confirma isso explicitamente

  const verified = Boolean(body?.verified) && dnsConfigured;

  return { ok: true, verified, verification: body?.verification };
}

export async function removeDomainFromVercelProject(domain: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasVercelEnv()) return { ok: false, error: "Integração com a Vercel não configurada no servidor." };

  const res = await fetch(`${VERCEL_API_BASE}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${teamQuery()}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  // 404 = já não existia lá, tratamos como sucesso (idempotente).
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message || `Erro ao remover domínio (HTTP ${res.status})` };
  }
  return { ok: true };
}

/**
 * Validação básica de formato — não substitui a validação real (feita pela
 * própria Vercel ao tentar adicionar), só evita chamadas óbvias inúteis.
 * Exige um domínio com pelo menos um ponto, sem protocolo/caminho, e
 * bloqueia explicitamente os domínios do próprio TOQY (ninguém deveria
 * conseguir "roubar" toqy.com.br pro próprio bio site).
 */
export function isValidCustomDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized || normalized.includes("/") || normalized.includes(" ")) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(normalized)) return false;
  const blocked = ["toqy.com.br", "www.toqy.com.br", "toqy.app", "vercel.app"];
  return !blocked.some((b) => normalized === b || normalized.endsWith(`.${b}`));
}
