-- =============================================
-- Toqy — Corrige permissão faltante em toqy_plaque_designs (2026-07-13)
-- Rode isso UMA VEZ no SQL Editor do Supabase (depois de
-- supabase_ai_plaque_generator.sql já ter sido aplicado).
--
-- Bug real: "permission denied for table toqy_plaque_designs" ao gerar
-- arte. A migration original criou a tabela + RLS, mas esqueceu do GRANT
-- explícito — neste projeto, tabelas novas não recebem acesso automático
-- pras roles anon/authenticated/service_role (confirmado no padrão já
-- usado em supabase/schema.sql pra outras tabelas). Sem o GRANT, nem a
-- service role (que deveria ignorar RLS) consegue gravar — Postgres barra
-- ANTES de sequer avaliar a policy de RLS.
-- =============================================

grant select, insert, update, delete on public.toqy_plaque_designs to service_role;
grant select, insert, update on public.toqy_plaque_designs to authenticated;
