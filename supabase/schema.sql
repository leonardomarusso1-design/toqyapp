create extension if not exists pgcrypto;

create table if not exists public.bio_sites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  business_name text not null,
  description text,
  template text not null default 'barbearia',
  theme jsonb,
  logo_url text,
  cover_images jsonb default '[]'::jsonb,
  phone text,
  whatsapp text,
  whatsapp_message text,
  instagram text,
  facebook text,
  address text,
  google_maps_url text,
  google_review_url text,
  booking_url text,
  pix_enabled boolean default true,
  pix_key text,
  pix_receiver text,
  pix_bank text,
  wifi_enabled boolean default true,
  wifi_ssid text,
  wifi_password text,
  wifi_encryption text default 'WPA',
  actions jsonb default '{}'::jsonb,
  edit_key_hash text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bio_site_services (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid references public.bio_sites(id) on delete cascade,
  name text not null,
  description text,
  price text,
  image_url text,
  image_key text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bio_sites_slug_idx on public.bio_sites (slug);
create index if not exists bio_site_services_bio_site_id_idx on public.bio_site_services (bio_site_id);

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

drop trigger if exists bio_site_services_set_updated_at on public.bio_site_services;
create trigger bio_site_services_set_updated_at
before update on public.bio_site_services
for each row execute function public.set_updated_at();

alter table public.bio_sites enable row level security;
alter table public.bio_site_services enable row level security;

drop policy if exists "Public can read active bio sites" on public.bio_sites;
create policy "Public can read active bio sites"
on public.bio_sites
for select
to anon
using (is_active = true);

drop policy if exists "Public can read active services from active bio sites" on public.bio_site_services;
create policy "Public can read active services from active bio sites"
on public.bio_site_services
for select
to anon
using (
  is_active = true
  and exists (
    select 1
    from public.bio_sites
    where bio_sites.id = bio_site_services.bio_site_id
      and bio_sites.is_active = true
  )
);

-- Do not create anon insert/update/delete policies.
-- Server Route Handlers use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.bio_sites to anon;
grant select on public.bio_site_services to anon;
grant all privileges on public.bio_sites to service_role;
grant all privileges on public.bio_site_services to service_role;
