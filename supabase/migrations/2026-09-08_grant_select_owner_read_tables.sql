-- Bug real (2026-09-08, reportado ao vivo: "o analytics não tá
-- funcionando, já abri o link do yakisabor várias vezes, e não sobe
-- painel") — toqy_analytics_events, toqy_leads e toqy_bookings foram
-- criadas via migration SQL crua com RLS policy de leitura pro dono
-- ("owner_read"), mas SEM o GRANT base de SELECT pro role authenticated
-- — diferente de toqy_biosites, que ganhou os grants automaticamente
-- (criada por outro caminho, provavelmente pelo Table Editor do
-- Supabase Studio, que grant tudo por padrão).
--
-- Resultado: mesmo com a RLS policy certa e dados sendo gravados
-- normalmente (confirmado ao investigar: 110 eventos reais gravados
-- pro yakisabor, todos recentes), o dono logado nunca conseguia LER
-- nada — "permission denied for table" no Postgres, engolido em
-- silêncio pelo código do cliente (a query só fazia `const { data } =
-- await supabase...`, sem checar `error`, então `data` virava null e a
-- UI mostrava zero em tudo, sem nenhum aviso).
--
-- Aplicado direto em produção via MCP do Supabase no momento do
-- diagnóstico (2026-09-08) — este arquivo documenta a mudança pro
-- histórico de migrations, mesma prática de todas as outras.
--
-- RLS continua sendo a fronteira de segurança de verdade (cada policy
-- "owner_read" já só permite ver linhas dos PRÓPRIOS bio sites via
-- site_data->>'id' = bio_site_id, ver migrations anteriores); este
-- GRANT só libera a checagem de privilégio de TABELA que faltava, sem
-- mudar o que cada policy permite.
grant select on public.toqy_analytics_events to authenticated;
grant select on public.toqy_leads to authenticated;
grant select on public.toqy_bookings to authenticated;
