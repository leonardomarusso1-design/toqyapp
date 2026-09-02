import type { SupabaseClient } from "@supabase/supabase-js";

// Rate limiting básico (2026-09-01, auditoria de segurança) — usa a função
// atômica check_rate_limit() no Postgres (ver supabase/migrations), só
// chamável por service_role. `key` deve incluir o IP e o recurso (ex:
// `verify-key:${slug}:${ip}`) pra limitar por combinação IP+alvo, não só
// por IP global (evita um vizinho de rede legítimo ser bloqueado por causa
// de outro usuário no mesmo IP compartilhado/CGNAT).
export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Best-effort: se a checagem falhar (função ausente, erro de rede
    // interno), nunca bloqueia o usuário legítimo por causa disso.
    console.error("[rateLimit] check_rate_limit falhou:", error.message);
    return true;
  }
  return Boolean(data);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
