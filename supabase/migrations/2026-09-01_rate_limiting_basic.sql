-- Migração: rate limiting básico (tabela + função atômica no Postgres)
-- Criada: 2026-09-01 (auditoria de segurança, skill security-audit)
-- JÁ APLICADA em produção via MCP apply_migration nesta sessão.
--
-- Confirmado que não existia NENHUMA implementação de rate limiting antes
-- disso, só uma menção em doc de planejamento. Usa o próprio Postgres
-- (upsert com ON CONFLICT é atômico por linha, sem race condition) em vez
-- de um serviço pago (Upstash) -- migrar pra lá depois se o volume
-- justificar. Ver src/lib/rateLimit.ts para o helper usado nas rotas
-- (verify-key, biosite/save, upload-image, analytics/track, lead, webhook
-- da Kiwify).

create table if not exists public.toqy_rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);
alter table public.toqy_rate_limits enable row level security;
-- RLS habilitado, zero policies -- só service_role acessa (mesmo padrão de
-- toqy_kiwify_events/toqy_pending_plans).

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.toqy_rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when public.toqy_rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then 1
          else public.toqy_rate_limits.count + 1
        end,
        window_start = case
          when public.toqy_rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then now()
          else public.toqy_rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
