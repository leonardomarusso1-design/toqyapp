-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================
-- REGERADO A PARTIR DO BANCO REAL (2026-07-16, Fase 1 do roadmap)
-- ============================================
-- Este arquivo estava desatualizado — descrevia tabelas que NUNCA
-- existiram no banco real deste projeto (organizations, bio_sites,
-- catalog_items, access_keys, analytics_events, subscriptions). O código
-- da aplicação sempre usou as tabelas reais abaixo (prefixo toqy_),
-- criadas diretamente no banco (dashboard/SQL ad-hoc), nunca versionadas
-- aqui. Conteúdo abaixo foi extraído ao vivo do projeto Supabase
-- "leonardo-ecossistema" (banco compartilhado do ecossistema — este
-- arquivo documenta só as tabelas que o ToqyApp usa; marusso_products,
-- quiz_leads e curso_waitlist pertencem a outros projetos no mesmo banco).
--
-- Banco compartilhado: schema.sql de cada projeto (ToqyApp, site-
-- leonardomarusso, etc.) documenta só o SEU subconjunto de tabelas —
-- nenhum é dono do banco inteiro.

-- ============================================
-- Profiles Table
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  subscription_status text default 'active',
  kiwify_customer_id text,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  has_ebook boolean default false,
  has_kit boolean default false,
  plan_tier text default 'free',
  phone text,
  cpf text unique,
  plan_toqy text not null default 'free' check (plan_toqy in ('free', 'community', 'freelancer', 'agency')),
  plan_toqy_since timestamptz,
  plan_toqy_expires_at timestamptz,
  biosites_limit integer not null default 1,
  kiwify_order_id_toqy text,
  discord_invited_at timestamptz,
  biosites_count integer default 0,
  avatar_url text,
  ai_art_credits_used integer not null default 0,
  referral_code text unique,
  referred_by_code text,
  referral_bonus_biosites integer not null default 0
);

comment on column public.profiles.ai_art_credits_used is
  'Quantas artes de plaquinha já foram geradas por IA — contra o limite vitalício do plano (PLAN_AI_ART_CREDITS). Não reseta mensalmente (planos são pagamento único).';

-- Fase 1 do roadmap (2026-07-16) — ver supabase/migrations/2026-07-16_freelancer_recurring.sql.
-- Adicionar manualmente se ainda não aplicado:
-- alter table public.profiles add column if not exists legacy_lifetime_access boolean not null default false;

-- Fase 2 do roadmap (2026-07-16, Revenue Share — Agência) — ver
-- supabase/migrations/2026-07-16_agency_revenue_share.sql. APLICADA no banco
-- real em 2026-07-16 (via Supabase MCP, projeto leonardo-ecossistema). Cria
-- toqy_resellers, toqy_managed_clients, toqy_commission_ledger (definições
-- abaixo, seção "Revenue Share — Agência") e estende handle_new_user() pra
-- ler managed_by_reseller_code (ver função mais abaixo).

create index if not exists profiles_cpf_idx on public.profiles (cpf);
create index if not exists profiles_plan_tier_idx on public.profiles (plan_tier);

-- ============================================
-- Bio Sites Table (prefixo toqy_ — não confundir com bio_sites, que não existe)
-- ============================================
create table if not exists public.toqy_biosites (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id),
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'draft', 'disabled')),
  edit_key_hash text not null,
  site_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text
);

create index if not exists toqy_biosites_owner_idx on public.toqy_biosites (owner_profile_id);
create index if not exists toqy_biosites_slug_idx on public.toqy_biosites (slug);

-- ============================================
-- Kiwify Webhook Events (auditoria)
-- ============================================
create table if not exists public.toqy_kiwify_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  product_name text,
  customer_email text,
  order_id text,
  plan_granted text,
  raw_payload jsonb,
  processed_at timestamptz default now()
);

-- ============================================
-- Planos Pendentes (compra antes de criar conta)
-- ============================================
create table if not exists public.toqy_pending_plans (
  email text primary key,
  plan_toqy text not null,
  biosites_limit integer not null,
  kiwify_order_id text,
  created_at timestamptz default now()
);

-- ============================================
-- Artes de Plaquinha Geradas por IA
-- ============================================
create table if not exists public.toqy_plaque_designs (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id),
  biosite_id uuid references public.toqy_biosites(id),
  plaque_type text not null,
  size_label text not null,
  business_name text,
  extra_info text,
  logo_url text,
  image_url text,
  canvas_data jsonb,
  status text not null default 'ready',
  error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seq_number integer
);

comment on table public.toqy_plaque_designs is
  'Artes de plaquinha geradas por IA (Gemini 2.5 Flash Image) — cada linha consome 1 crédito do plano do dono.';

create index if not exists idx_plaque_designs_owner on public.toqy_plaque_designs (owner_profile_id, created_at desc);

-- ============================================
-- QR Codes avulsos (Pix / Link)
-- ============================================
create table if not exists public.toqy_qr_codes (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id),
  seq_number integer not null,
  slug text not null unique,
  mode text not null check (mode in ('pix', 'link')),
  label text,
  pix_key text,
  pix_receiver_name text,
  pix_city text,
  pix_amount numeric,
  target_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toqy_qr_codes_owner_idx on public.toqy_qr_codes (owner_profile_id);

-- ============================================
-- Programa de Indicação
-- ============================================
create table if not exists public.toqy_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid not null references public.profiles(id),
  referred_profile_id uuid not null unique references public.profiles(id),
  referral_code text not null,
  converted_at timestamptz,
  rewarded boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists toqy_referrals_referrer_idx on public.toqy_referrals (referrer_profile_id);

-- ============================================
-- Analytics de Bio Sites
-- ============================================
create table if not exists public.toqy_analytics_events (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null references public.toqy_biosites(id),
  event_type text not null,
  button_id text,
  button_label text,
  user_agent text,
  referer text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists toqy_analytics_events_biosite_idx on public.toqy_analytics_events (bio_site_id, created_at desc);

-- ============================================
-- Funções e Triggers reais (extraídas do banco ao vivo)
-- ============================================

create or replace function public.set_updated_at_toqy()
returns trigger
language plpgsql
as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists toqy_biosites_updated_at on public.toqy_biosites;
create trigger toqy_biosites_updated_at
before update on public.toqy_biosites
for each row execute function public.set_updated_at_toqy();

drop trigger if exists toqy_qr_codes_set_updated_at on public.toqy_qr_codes;
create trigger toqy_qr_codes_set_updated_at
before update on public.toqy_qr_codes
for each row execute function public.set_updated_at_toqy();

-- Nota: toqy_plaque_designs também tem coluna updated_at mas NENHUM
-- trigger automático associado a ela hoje (confirmado ao vivo) — quem
-- atualiza esse campo é o próprio código da aplicação.

create or replace function public.update_biosites_count()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles
    set biosites_count = (
      select count(*) from public.toqy_biosites where owner_profile_id = new.owner_profile_id
    )
    where id = new.owner_profile_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles
    set biosites_count = (
      select count(*) from public.toqy_biosites where owner_profile_id = old.owner_profile_id
    )
    where id = old.owner_profile_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_biosite_change on public.toqy_biosites;
create trigger on_biosite_change
after insert or delete on public.toqy_biosites
for each row execute function public.update_biosites_count();

-- ============================================
-- Revenue Share — Agência (Fase 2 do roadmap, 2026-07-16)
-- ============================================
-- Ver supabase/migrations/2026-07-16_agency_revenue_share.sql pro contexto
-- completo (por que Afiliados Kiwify e não coprodução, achado sobre
-- attribution_status ser auditoria e não trava técnica).
create table if not exists public.toqy_resellers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id),
  reseller_code text unique,
  kiwify_affiliate_id text,
  kiwify_affiliate_email text,
  commission_pct numeric not null default 70,
  status text not null default 'pending_invite'
    check (status in ('pending_invite', 'active', 'suspended')),
  invited_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toqy_resellers_profile_idx on public.toqy_resellers (profile_id);
create index if not exists toqy_resellers_code_idx on public.toqy_resellers (reseller_code);

create table if not exists public.toqy_managed_clients (
  id uuid primary key default gen_random_uuid(),
  reseller_profile_id uuid not null references public.profiles(id),
  client_profile_id uuid unique references public.profiles(id),
  invite_email text,
  reseller_code text,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists toqy_managed_clients_invite_email_idx
  on public.toqy_managed_clients (reseller_profile_id, lower(invite_email))
  where client_profile_id is null;

create index if not exists toqy_managed_clients_reseller_idx on public.toqy_managed_clients (reseller_profile_id);

create table if not exists public.toqy_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  managed_client_id uuid references public.toqy_managed_clients(id),
  reseller_profile_id uuid not null references public.profiles(id),
  client_profile_id uuid references public.profiles(id),
  kiwify_order_id text not null unique,
  kiwify_affiliate_id text,
  product_name text,
  sale_amount_cents integer,
  commission_amount_cents integer,
  currency text not null default 'BRL',
  event_type text,
  attribution_status text not null default 'matched'
    check (attribution_status in ('matched', 'affiliate_mismatch', 'refunded')),
  raw_sale_detail jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists toqy_commission_ledger_reseller_idx
  on public.toqy_commission_ledger (reseller_profile_id, occurred_at desc);

-- Cria/atualiza o profile automaticamente a cada novo signup do Supabase
-- Auth — também aplica plano pendente (toqy_pending_plans, comprado antes
-- de criar conta), registra indicação (toqy_referrals) se o novo usuário
-- veio por um link de indicação (?ref=CODIGO), e vincula o novo usuário a
-- um revendedor (toqy_managed_clients) se veio por link/convite de revenda
-- (Fase 2 do roadmap, 2026-07-16 — Revenue Share/Agência).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  pending record;
  ref_code text;
  referrer_id uuid;
  reseller_code_meta text;
  reseller_id uuid;
begin
  select * into pending from public.toqy_pending_plans where email = new.email;

  ref_code := new.raw_user_meta_data->>'referred_by_code';
  reseller_code_meta := new.raw_user_meta_data->>'managed_by_reseller_code';

  insert into public.profiles (id, email, full_name, phone, cpf, plan_tier, plan_toqy, biosites_limit, subscription_status, referred_by_code, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf',
    'free',
    coalesce(pending.plan_toqy, 'free'),
    coalesce(pending.biosites_limit, 1),
    'active',
    ref_code,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    phone = coalesce(excluded.phone, profiles.phone),
    cpf = coalesce(excluded.cpf, profiles.cpf),
    plan_toqy = coalesce(pending.plan_toqy, profiles.plan_toqy),
    biosites_limit = coalesce(pending.biosites_limit, profiles.biosites_limit),
    updated_at = now();

  if pending.email is not null then
    delete from public.toqy_pending_plans where email = new.email;
  end if;

  if ref_code is not null then
    select id into referrer_id from public.profiles where referral_code = ref_code;
    if referrer_id is not null and referrer_id <> new.id then
      insert into public.toqy_referrals (referrer_profile_id, referred_profile_id, referral_code)
      values (referrer_id, new.id, ref_code)
      on conflict (referred_profile_id) do nothing;
    end if;
  end if;

  if reseller_code_meta is not null then
    select profile_id into reseller_id from public.toqy_resellers where reseller_code = reseller_code_meta;
    if reseller_id is not null and reseller_id <> new.id then
      update public.toqy_managed_clients
      set client_profile_id = new.id, status = 'active', updated_at = now()
      where reseller_profile_id = reseller_id
        and client_profile_id is null
        and lower(invite_email) = lower(new.email);

      insert into public.toqy_managed_clients (reseller_profile_id, client_profile_id, reseller_code, status)
      values (reseller_id, new.id, reseller_code_meta, 'active')
      on conflict (client_profile_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================
-- Row Level Security
-- ============================================
-- Todas as tabelas acima têm RLS habilitado no banco real (confirmado ao
-- vivo, 2026-07-16). As policies específicas vivem em supabase/policies.sql
-- (arquivo separado) — não duplicadas aqui.
alter table public.profiles enable row level security;
alter table public.toqy_biosites enable row level security;
alter table public.toqy_kiwify_events enable row level security;
alter table public.toqy_pending_plans enable row level security;
alter table public.toqy_plaque_designs enable row level security;
alter table public.toqy_qr_codes enable row level security;
alter table public.toqy_referrals enable row level security;
alter table public.toqy_analytics_events enable row level security;
alter table public.toqy_resellers enable row level security;
alter table public.toqy_managed_clients enable row level security;
alter table public.toqy_commission_ledger enable row level security;

comment on table public.profiles is 'Perfis de usuário do ToqyApp — plano, limites, dados pessoais';
comment on table public.toqy_biosites is 'Bio sites criados pelos usuários';
comment on table public.toqy_kiwify_events is 'Auditoria de todos os eventos recebidos do webhook da Kiwify';
comment on table public.toqy_pending_plans is 'Plano comprado antes do usuário criar conta — aplicado no signup (handle_new_user)';
comment on table public.toqy_qr_codes is 'QR Codes avulsos (Pix ou link), sem precisar de bio site';
comment on table public.toqy_referrals is 'Programa de indicação — recompensa quem indica no primeiro pagamento do indicado';
comment on table public.toqy_analytics_events is 'Eventos de analytics dos bio sites públicos';
comment on table public.toqy_resellers is 'Metadados de revenda por perfil Agência — status do cadastro de afiliado na Kiwify e código de captação de clientes gerenciados';
comment on table public.toqy_managed_clients is 'Cliente final gerenciado por um revendedor Agência — só vendas para clientes aqui contam pra comissão (UX + auditoria, não trava técnica da Kiwify)';
comment on table public.toqy_commission_ledger is 'Uma linha por venda atribuída a um revendedor — kiwify_order_id UNIQUE garante idempotência';
