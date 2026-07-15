-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
-- REGERADO A PARTIR DO BANCO REAL (2026-07-16, junto com schema.sql)
-- ============================================
-- Este arquivo estava completamente desatualizado — descrevia policies
-- para tabelas que nunca existiram no banco real (organizations,
-- bio_sites, catalog_items, access_keys, subscriptions). As policies
-- abaixo foram extraídas ao vivo do projeto Supabase "leonardo-ecossistema"
-- (ljsdkegxfcwrwqosbjsm) via `select * from pg_policies where schemaname
-- = 'public'`, para as tabelas reais do ToqyApp (prefixo toqy_ + profiles).

-- ============================================
-- Profiles
-- ============================================
alter table public.profiles enable row level security;

create policy "Service role full access"
  on public.profiles
  for all
  using (auth.role() = 'service_role');

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to anon, authenticated
  with check (true);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Nota: existe uma segunda policy de SELECT redundante no banco ao vivo
-- ("Usuários podem ver o próprio perfil.", mesma condição auth.uid() = id) -
-- provavelmente resquício de migração antiga. Não recriada aqui de propósito;
-- se for limpar, use DROP POLICY no banco real, não neste arquivo.

-- ============================================
-- Bio Sites (toqy_biosites)
-- ============================================
alter table public.toqy_biosites enable row level security;

create policy "Public read active biosites"
  on public.toqy_biosites
  for select
  to anon, authenticated
  using (status = 'active');

create policy "Users can read own biosites"
  on public.toqy_biosites
  for select
  to authenticated
  using (owner_profile_id = auth.uid());

create policy "Users can insert own biosites"
  on public.toqy_biosites
  for insert
  to authenticated
  with check (owner_profile_id = auth.uid());

create policy "Users can update own biosites"
  on public.toqy_biosites
  for update
  to authenticated
  using (owner_profile_id = auth.uid());

create policy "Users can delete own biosites"
  on public.toqy_biosites
  for delete
  to authenticated
  using (owner_profile_id = auth.uid());

-- ============================================
-- Kiwify Webhook Events (toqy_kiwify_events)
-- ============================================
-- RLS habilitado, ZERO policies no banco real — acesso só via service
-- role key (usado pelo backend do webhook, que bypassa RLS). Isso é
-- intencional: nenhum usuário anon/authenticated deve ler ou escrever
-- aqui direto. Sinalizado pelo advisor de segurança do Supabase como
-- "rls_enabled_no_policy" (nível INFO) — não é regressão, é o desenho
-- atual. Ver PENDING.md: segurança de produto está fora de escopo desta
-- rodada por decisão do Leonardo.
alter table public.toqy_kiwify_events enable row level security;

-- ============================================
-- Planos Pendentes (toqy_pending_plans)
-- ============================================
-- Mesmo caso de toqy_kiwify_events: RLS habilitado, zero policies,
-- acesso só via service role (handle_new_user() e o backend de checkout).
alter table public.toqy_pending_plans enable row level security;

-- ============================================
-- Artes de Plaquinha (toqy_plaque_designs)
-- ============================================
alter table public.toqy_plaque_designs enable row level security;

create policy "Plaque designs own"
  on public.toqy_plaque_designs
  for all
  using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());

-- ============================================
-- QR Codes avulsos (toqy_qr_codes)
-- ============================================
alter table public.toqy_qr_codes enable row level security;

create policy "toqy_qr_codes_public_read"
  on public.toqy_qr_codes
  for select
  using (true);

create policy "toqy_qr_codes_owner_all"
  on public.toqy_qr_codes
  for all
  using (auth.uid() = owner_profile_id)
  with check (auth.uid() = owner_profile_id);

-- ============================================
-- Programa de Indicação (toqy_referrals)
-- ============================================
alter table public.toqy_referrals enable row level security;

create policy "toqy_referrals_owner_read"
  on public.toqy_referrals
  for select
  using (auth.uid() = referrer_profile_id or auth.uid() = referred_profile_id);

-- Nota: não existe policy de INSERT para toqy_referrals no banco real —
-- as linhas são criadas via handle_new_user() (SECURITY DEFINER), que
-- bypassa RLS. Nenhum usuário insere diretamente.

-- ============================================
-- Analytics de Bio Sites (toqy_analytics_events)
-- ============================================
alter table public.toqy_analytics_events enable row level security;

create policy "toqy_analytics_events_public_insert"
  on public.toqy_analytics_events
  for insert
  with check (true);

create policy "toqy_analytics_events_owner_read"
  on public.toqy_analytics_events
  for select
  using (
    bio_site_id in (
      select id from public.toqy_biosites where owner_profile_id = auth.uid()
    )
  );

-- ============================================
-- Revenue Share — Agência (Fase 2 do roadmap, 2026-07-16)
-- ============================================
-- Aplicadas via supabase/migrations/2026-07-16_agency_revenue_share.sql.
-- Só SELECT client-side — insert/update é sempre via service role (webhook
-- ou rota de API), nunca direto do client.
alter table public.toqy_resellers enable row level security;

create policy "toqy_resellers_owner_read"
  on public.toqy_resellers
  for select
  using (auth.uid() = profile_id);

alter table public.toqy_managed_clients enable row level security;

create policy "toqy_managed_clients_reseller_read"
  on public.toqy_managed_clients
  for select
  using (auth.uid() = reseller_profile_id or auth.uid() = client_profile_id);

alter table public.toqy_commission_ledger enable row level security;

create policy "toqy_commission_ledger_reseller_read"
  on public.toqy_commission_ledger
  for select
  using (auth.uid() = reseller_profile_id);

-- ============================================
-- Advisories conhecidos (não corrigidos aqui — fora de escopo)
-- ============================================
-- 1. "Users can insert own profile" (profiles) e
--    "toqy_analytics_events_public_insert" usam WITH CHECK (true) —
--    sinalizados pelo linter como policy permissiva demais. É o desenho
--    atual (insert público de analytics, signup público de profile).
-- 2. handle_new_user, update_biosites_count e rls_auto_enable são
--    SECURITY DEFINER executáveis por anon/authenticated via RPC —
--    sinalizado pelo linter. Revisão de segurança de produto está
--    registrada como pendência separada em .claude/jarvis/PENDING.md.
