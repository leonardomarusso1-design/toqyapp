-- =============================================
-- ToqyApp — Analytics real (2026-07-16)
--
-- O plano já promete "Analytics" (hasAnalytics em subscriptions.ts) desde
-- sempre, mas nada disso existia de verdade: /api/analytics/track só
-- recebia o evento e descartava (insert comentado como "TODO Phase 8"),
-- e nenhuma tela em PublicBioSite.tsx sequer CHAMAVA o tracker. Essa
-- migracao cria a tabela real que faltava.
-- =============================================

create table if not exists toqy_analytics_events (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null references toqy_biosites(id) on delete cascade,
  event_type text not null,
  button_id text,
  button_label text,
  user_agent text,
  referer text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists toqy_analytics_events_biosite_idx on toqy_analytics_events (bio_site_id, created_at desc);

-- Insert público (o visitante do bio site nunca está autenticado), sem
-- select/update/delete pra ninguém além do service role — mesmo padrão
-- de "grava mas só o dono lê" já usado no resto do projeto.
grant insert on toqy_analytics_events to anon, authenticated;
grant all on toqy_analytics_events to service_role;

alter table toqy_analytics_events enable row level security;

drop policy if exists "toqy_analytics_events_public_insert" on toqy_analytics_events;
create policy "toqy_analytics_events_public_insert" on toqy_analytics_events
  for insert with check (true);

drop policy if exists "toqy_analytics_events_owner_read" on toqy_analytics_events;
create policy "toqy_analytics_events_owner_read" on toqy_analytics_events
  for select using (
    bio_site_id in (select id from toqy_biosites where owner_profile_id = auth.uid())
  );
