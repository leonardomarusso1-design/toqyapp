-- Agendamento nativo (2026-09-07, referência Coonexta — documento de
-- análise: fluxo "escolher serviço → escolher dia → escolher horário →
-- confirmar" dentro da própria página pública). Serviços (nome,
-- duração, preço) vivem no JSON site_data igual ao catálogo — só a
-- RESERVA em si (dado gerado por um visitante anônimo, que o dono
-- precisa listar depois) precisa de tabela própria, mesmo padrão de
-- toqy_leads (2026-09-07_toqy_leads.sql).
create table if not exists public.toqy_bookings (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null,
  service_id text not null,
  service_name text not null, -- snapshot do nome no momento da reserva (o serviço pode mudar/sumir depois)
  customer_name text not null,
  customer_phone text not null,
  notes text,
  booking_date date not null,
  booking_time time not null,
  status text not null default 'confirmed', -- 'confirmed' | 'cancelled' (cancelamento fica pra depois, campo já nasce pronto)
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists toqy_bookings_bio_site_id_idx on public.toqy_bookings (bio_site_id);
-- Índice composto pra checagem de conflito de horário (existe reserva
-- neste site, nesta data, neste horário?) — é a query mais frequente,
-- roda a cada tentativa de agendamento.
create index if not exists toqy_bookings_slot_idx on public.toqy_bookings (bio_site_id, booking_date, booking_time);

alter table public.toqy_bookings enable row level security;

-- RLS ligado, só policy de leitura pro dono do bio site (mesmo padrão de
-- toqy_analytics_events/toqy_leads — bio_site_id guarda site_data->>'id',
-- não a chave primária da linha, ver 2026-09-06_fix_analytics_events_rls_read.sql
-- pro motivo). Escrita: zero policy = negado por padrão pra anon/
-- authenticated; só o service_role grava, de dentro de
-- /api/biosite-booking, que valida o site (existe + ativo), o serviço
-- (existe + habilitado) e o horário (dentro do expediente, sem
-- conflito) antes de inserir.
create policy toqy_bookings_owner_read
  on public.toqy_bookings
  for select
  using (
    bio_site_id in (
      select (site_data->>'id')::uuid
      from public.toqy_biosites
      where owner_profile_id = auth.uid()
    )
  );

comment on table public.toqy_bookings is
  'Reservas feitas pelo fluxo de agendamento nativo do bio site público. RLS: só o dono lê as próprias; escrita só via service_role em /api/biosite-booking, nunca direto do client.';
