-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================
-- Organizations Table
-- ============================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  logo_url text,
  website text,
  status text default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists organizations_email_idx on public.organizations (email);
create index if not exists organizations_status_idx on public.organizations (status);

-- ============================================
-- Bio Sites Table
-- ============================================
create table if not exists public.bio_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  slug text unique not null,
  business_name text not null,
  description text,
  segment text default 'outro' check (segment in ('barbearia', 'salao', 'restaurante', 'lanchonete', 'pastelaria', 'loja', 'assistencia_tecnica', 'clinica', 'petshop', 'oficina', 'delivery', 'servicos', 'fotografo', 'dentista', 'outro')),
  profile_data jsonb,
  theme jsonb,
  buttons jsonb default '[]'::jsonb,
  catalog jsonb default '[]'::jsonb,
  catalog_layout text default 'stack' check (catalog_layout in ('carousel', 'grid', 'stack', 'grouped', 'category-carousel')),
  pix_config jsonb,
  wifi_config jsonb,
  status text default 'active' check (status in ('active', 'draft', 'disabled')),
  is_public boolean default true,
  edit_key text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bio_sites_slug_idx on public.bio_sites (slug);
create index if not exists bio_sites_user_id_idx on public.bio_sites (user_id);
create index if not exists bio_sites_org_id_idx on public.bio_sites (organization_id);
create index if not exists bio_sites_status_idx on public.bio_sites (status);

-- ============================================
-- Products/Catalog Table
-- ============================================
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null references public.bio_sites(id) on delete cascade,
  name text not null,
  description text,
  price text,
  image_url text,
  image_key text,
  category text,
  image_layout text default 'horizontal' check (image_layout in ('square', 'horizontal')),
  action_label text,
  action_url text,
  sort_order integer default 0,
  is_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists catalog_items_site_id_idx on public.catalog_items (bio_site_id);
create index if not exists catalog_items_category_idx on public.catalog_items (category);

-- ============================================
-- Access Keys Table (Client Edit Keys)
-- ============================================
create table if not exists public.access_keys (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null references public.bio_sites(id) on delete cascade,
  key text not null unique,
  name text,
  description text,
  is_active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  expires_at timestamptz
);

create index if not exists access_keys_site_id_idx on public.access_keys (bio_site_id);
create index if not exists access_keys_key_idx on public.access_keys (key);
create index if not exists access_keys_active_idx on public.access_keys (is_active);

-- ============================================
-- Analytics Events Table
-- ============================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null references public.bio_sites(id) on delete cascade,
  event_type text not null check (event_type in ('page_view', 'whatsapp_click', 'instagram_click', 'pix_click', 'wifi_click', 'phone_click', 'maps_click', 'booking_click', 'review_click', 'catalog_view', 'qr_scan')),
  button_id text,
  button_label text,
  user_agent text,
  ip_address text,
  referer text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists analytics_events_site_id_idx on public.analytics_events (bio_site_id);
create index if not exists analytics_events_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);
create index if not exists analytics_events_site_created_idx on public.analytics_events (bio_site_id, created_at);

-- ============================================
-- Subscriptions Table
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_type text not null check (plan_type in ('free', 'community', 'freelancer', 'agency')),
  max_sites integer default 1,
  status text default 'active' check (status in ('active', 'inactive', 'cancelled', 'expired')),
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists subscriptions_org_id_idx on public.subscriptions (organization_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_plan_idx on public.subscriptions (plan_type);

-- ============================================
-- Storage Buckets Policy Setup (placeholder)
-- ============================================
-- Note: Buckets created via Supabase Dashboard:
-- - logos
-- - backgrounds
-- - catalogs
-- - profiles

comment on table public.organizations is 'Organizations that manage biosites';
comment on table public.bio_sites is 'Bio sites/digital business cards';
comment on table public.catalog_items is 'Products/services in catalog';
comment on table public.access_keys is 'Client access keys for editing biosites';
comment on table public.analytics_events is 'Analytics events tracked on biosites';
comment on table public.subscriptions is 'Subscription plans for organizations';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bio_sites_set_updated_at on public.bio_sites;
create trigger bio_sites_set_updated_at
before update on public.bio_sites
for each row execute function public.set_updated_at();

alter table public.bio_sites enable row level security;

drop policy if exists "Public can read active bio sites" on public.bio_sites;
create policy "Public can read active bio sites"
on public.bio_sites
for select
to anon
using (status = 'active' and is_public = true);

drop policy if exists "Users can view own bio sites" on public.bio_sites;
create policy "Users can view own bio sites"
on public.bio_sites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own bio sites" on public.bio_sites;
create policy "Users can create own bio sites"
on public.bio_sites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own bio sites" on public.bio_sites;
create policy "Users can update own bio sites"
on public.bio_sites
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bio sites" on public.bio_sites;
create policy "Users can delete own bio sites"
on public.bio_sites
for delete
to authenticated
using (auth.uid() = user_id);

-- Do not create anon insert/update/delete policies.
-- Server Route Handlers use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.bio_sites to anon;
grant all privileges on public.bio_sites to service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  cpf text unique,
  plan_tier text default 'free' check (plan_tier in ('free', 'community', 'freelancer', 'agency')),
  subscription_status text default 'active' check (subscription_status in ('active', 'canceled', 'past_due', 'inactive')),
  kiwify_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_plan_tier_idx on public.profiles (plan_tier);
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, cpf)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    cpf = excluded.cpf,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
