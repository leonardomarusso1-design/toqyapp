-- Bug real corrigido (2026-09-06, achado ao vivo pelo Leonardo: "abri um
-- biosite da barbearia-andrian, cliquei em links, mas no meu painel nao
-- atualizou nada" — MESMO DEPOIS de corrigir a FK que impedia a gravação
-- em 2026-09-05).
--
-- Causa: a policy de leitura (RLS) comparava bio_site_id com
-- toqy_biosites.id (chave primária REAL da linha) — o mesmo erro de
-- id-errado da FK corrigida antes, só que do lado da LEITURA. O dono via
-- 0 eventos pra sempre (RLS filtra silenciosamente, sem erro) mesmo com
-- eventos gravados de verdade, porque bio_site_id guarda site_data->>'id'
-- (o id do JSON), nunca o id da linha.
--
-- JÁ APLICADA em produção via MCP apply_migration nesta sessão.
drop policy if exists toqy_analytics_events_owner_read on public.toqy_analytics_events;
create policy toqy_analytics_events_owner_read
  on public.toqy_analytics_events
  for select
  using (
    bio_site_id in (
      select (site_data->>'id')::uuid
      from public.toqy_biosites
      where owner_profile_id = auth.uid()
    )
  );
