-- Tabela de leads capturados no bio site público (2026-09-07, referência
-- Coonexta — vídeo do Leonardo: menu "Captura de leads"/"Cadastros deste
-- site"). Distinta de `public.leads` (2026-09-06_lead_consent.sql), que é
-- só do formulário do ebook de marketing do próprio Toqy — misturar as
-- duas juntaria lead de marketing do Toqy com lead de CLIENTE FINAL de
-- um bio site (dono diferente, finalidade diferente, RLS diferente).
--
-- bio_site_id guarda site_data->>'id' (o id gerado no client, dentro do
-- JSON), pelo MESMO motivo documentado em
-- 2026-09-06_fix_analytics_events_rls_read.sql: é o identificador que o
-- app inteiro usa de verdade (PublicBioSite.tsx ao gravar), não a chave
-- primária da linha — os dois valores podem divergir.
create table if not exists public.toqy_leads (
  id uuid primary key default gen_random_uuid(),
  bio_site_id uuid not null,
  name text not null,
  email text,
  phone text,
  message text,
  -- Mesma governança de consentimento de public.leads (LGPD art. 8º,
  -- §1º) — finalidade fixa aqui (é sempre "formulário do bio site"), mas
  -- versão do texto e data do aceite continuam precisando de prova.
  consent_version text,
  consented_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists toqy_leads_bio_site_id_idx on public.toqy_leads (bio_site_id);

alter table public.toqy_leads enable row level security;

-- RLS ligado, SÓ com policy de leitura pro dono do bio site (mesmo padrão
-- de toqy_analytics_events). Escrita: zero policy = negado por padrão
-- pra anon/authenticated — só o service_role grava, de dentro de
-- /api/biosite-lead, que valida o bio site (existe + ativo) e aplica
-- rate limit antes de inserir. Nenhum client-side Supabase insere direto
-- nesta tabela.
create policy toqy_leads_owner_read
  on public.toqy_leads
  for select
  using (
    bio_site_id in (
      select (site_data->>'id')::uuid
      from public.toqy_biosites
      where owner_profile_id = auth.uid()
    )
  );

comment on table public.toqy_leads is
  'Leads capturados pelo formulário de contato do bio site público (bloco "leadForm"). RLS: só o dono do bio site lê os próprios; escrita só via service_role em /api/biosite-lead, nunca direto do client.';
comment on column public.toqy_leads.consent_version is
  'Versão do texto de consentimento aceito pelo titular. Nulo = consentimento não registrado.';
comment on column public.toqy_leads.consented_at is
  'Data/hora do aceite explícito. Nulo = sem prova de consentimento.';
