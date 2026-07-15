-- Migração: Fase 1 do roadmap — "Planos e Preços — recorrência total"
-- Criada: 2026-07-16
-- Ver: projects/toqyapp/.planning/ROADMAP.md (Phase 1), PROJECT.md (PLAN-01 a PLAN-05)
--
-- NÃO APLICAR AUTOMATICAMENTE. Revisar e rodar manualmente (SQL Editor do
-- Supabase, ou via MCP com autorização explícita do Leonardo no momento).
--
-- Contexto: o plano Freelancer migra de pagamento único (R$59,90) pra
-- assinatura mensal (R$39,90). Quem já comprou o Freelancer como
-- pagamento único ANTES desta migração precisa manter acesso vitalício,
-- sem ser cobrado de novo e sem ser rebaixado por engano se algum evento
-- de cancelamento chegar associado ao e-mail dele (ver
-- src/app/api/kiwify/webhook/webhookLogic.ts:shouldDowngradeOnCancel).
--
-- ATUALIZADO 2026-07-16: schema.sql já foi regenerado a partir do banco
-- real (via Supabase MCP, projeto "leonardo-ecossistema",
-- ljsdkegxfcwrwqosbjsm) — ver supabase/schema.sql. Essa consulta também
-- revelou um bug real nesta migração: a tabela profiles NÃO TEM coluna
-- `created_at` (corrigido abaixo — usa só plan_toqy_since, que é
-- nullable).

-- 1. Nova coluna: acesso vitalício legado.
-- Desenhada de forma genérica (não só pro Freelancer) para a Fase 2 do
-- roadmap (Revenue Share — Agência) poder reaproveitá-la quando migrar
-- os compradores de Agência como pagamento único.
alter table public.profiles
  add column if not exists legacy_lifetime_access boolean not null default false;

comment on column public.profiles.legacy_lifetime_access is
  'true = comprou um plano como pagamento único antes da migração para recorrência (Freelancer, Fase 1; Agência, Fase 2) — nunca deve ser rebaixado/cobrado de novo pelo webhook da Kiwify. Ver .planning/ROADMAP.md.';

-- 2. Backfill: marcar quem já é Freelancer ou Agência ativo, comprado
-- antes do corte desta migração, como acesso vitalício legado.
--
-- Por que este critério funciona: não existia NENHUM produto recorrente
-- de Freelancer/Agência antes desta fase — todo profile com esses planos
-- e status ativo, com `plan_toqy_since` anterior ao corte (ou nulo — perfis
-- antigos de antes desse campo existir), é necessariamente um comprador de
-- pagamento único.
--
-- IMPORTANTE: rodar esta migração ANTES de trocar o link da Kiwify do
-- Freelancer pro produto novo recorrente em produção (senão um assinante
-- novo comprado entre a troca do link e a migração seria marcado como
-- legado por engano). Se já trocou o link antes de rodar, ajustar o
-- timestamp de corte abaixo pra ANTES do momento da troca.
update public.profiles
set legacy_lifetime_access = true
where plan_toqy in ('freelancer', 'agency')
  and subscription_status = 'active'
  and (plan_toqy_since is null or plan_toqy_since < '2026-07-16T23:59:59Z'); -- ajustar se necessário

-- 3. Verificação sugerida após rodar (rodar manualmente, conferir o número
-- antes de seguir):
-- select count(*) from public.profiles where legacy_lifetime_access = true;
