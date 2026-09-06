// Validação de ambiente (2026-09-06, achado P1 de auditoria externa:
// "Build real sem env falha ao coletar /api/lead... O ambiente de deploy
// não está sendo validado de forma amigável").
//
// O problema real não era faltar env — era a MENSAGEM: quando uma
// variável faltava, o erro que aparecia era `supabaseUrl is required`
// vindo de dentro da lib do Supabase, no meio de um build de 54 páginas,
// sem dizer QUAL variável nem ONDE configurar. Aqui a falha vira uma
// mensagem que diz exatamente o que preencher.
//
// Filosofia deliberada: NÃO derruba o build por env faltando. O projeto
// já tem fallbacks conscientes (supabaseServer retorna null, rotas
// respondem "Servidor não configurado") e o CI compila com placeholders
// de propósito. Isto aqui é diagnóstico — `assertRuntimeEnv()` é para ser
// chamado em runtime, onde a falta de env realmente impede a operação.

type EnvSpec = {
  name: string;
  required: "always" | "server-runtime";
  description: string;
};

const ENV_SPEC: EnvSpec[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: "always",
    description: "URL do projeto Supabase (Settings > API > Project URL)",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: "always",
    description: "Chave anônima/publishable do Supabase (Settings > API)",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: "server-runtime",
    description: "Service role do Supabase — NUNCA expor no cliente, só em rota de servidor",
  },
  {
    name: "RESEND_API_KEY",
    required: "server-runtime",
    description: "Chave da Resend, usada nos e-mails transacionais (plano ativado, lead, trial vencido)",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: "server-runtime",
    description: "URL pública canônica (ex: https://toqy.com.br) — usada em sitemap, e-mails e QR",
  },
];

export type EnvReport = {
  ok: boolean;
  missing: Array<{ name: string; description: string }>;
};

/** Diagnóstico legível — usado por `assertRuntimeEnv` e pelo checklist de deploy. */
export function checkEnv(scope: "always" | "server-runtime" = "server-runtime"): EnvReport {
  const missing = ENV_SPEC
    .filter((spec) => (scope === "always" ? spec.required === "always" : true))
    .filter((spec) => !process.env[spec.name])
    .map(({ name, description }) => ({ name, description }));

  return { ok: missing.length === 0, missing };
}

/**
 * Lança um erro EXPLICATIVO quando falta env em runtime de servidor.
 * Diferente do erro cru da lib do Supabase, diz qual variável falta e
 * pra que ela serve. Use no topo de rota/serviço que realmente não
 * funciona sem a configuração — não no import de módulo compartilhado
 * (senão quebra o build estático, que roda com placeholder de propósito).
 */
export function assertRuntimeEnv(): void {
  const { ok, missing } = checkEnv("server-runtime");
  if (ok) return;

  const lista = missing.map((m) => `  - ${m.name}: ${m.description}`).join("\n");
  throw new Error(
    `Configuração de ambiente incompleta. Variáveis faltando:\n${lista}\n\n` +
      `Configure em Vercel > Project > Settings > Environment Variables ` +
      `(ou no .env.local para desenvolvimento). Ver .env.example.`
  );
}
