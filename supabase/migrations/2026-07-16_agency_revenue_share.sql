-- Migração: Fase 2 do roadmap — "Revenue Share — Agência"
-- Criada: 2026-07-16
-- Ver: projects/toqyapp/.planning/ROADMAP.md (Phase 2), VISION.md (seção E.1)
--
-- NÃO APLICAR AUTOMATICAMENTE. Revisar e rodar manualmente (SQL Editor do
-- Supabase, ou via MCP com autorização explícita do Leonardo no momento).
--
-- Contexto: Agência deixa de ser pagamento único e vira acesso gratuito à
-- plataforma white-label + comissão de 30% pro Toqy / 70% pro revendedor,
-- paga automaticamente pela Kiwify via programa de Afiliados (não
-- "coprodução" — decisão tomada nesta sessão após pesquisa: coprodução é
-- configurada manualmente por produto, sem API de criação, exigiria um
-- produto Kiwify dedicado por revendedor).
--
-- Achado aceito pelo Leonardo: o link de afiliado da Kiwify é único por
-- revendedor e a Kiwify paga comissão automática pra QUALQUER venda feita
-- através dele — não há trava técnica da Kiwify pra "só conta se for
-- cliente cadastrado no Toqy". O controle real é UX (revendedor só recebe
-- o link depois de cadastrar o cliente) + auditoria (attribution_status
-- abaixo), não um bloqueio automático.

-- ============================================
-- 1. toqy_resellers — metadados de afiliado Kiwify por revendedor
-- ============================================
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

comment on table public.toqy_resellers is
  'Metadados de revenda por perfil Agência — status do cadastro de afiliado na Kiwify (feito manualmente, sem API de criação) e código de captação de clientes gerenciados.';

-- ============================================
-- 2. toqy_managed_clients — "revendedor gerencia este cliente"
-- ============================================
-- Núcleo que não existe hoje em lugar nenhum: toqy_biosites.owner_profile_id
-- é posse plana; /app/clientes entrega usuário+chave pra cliente sem conta
-- própria. Aqui o cliente PRECISA ter conta própria (é ele quem paga via
-- Kiwify), então é um relacionamento novo, sem sobreposição com /app/clientes.
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

comment on table public.toqy_managed_clients is
  'Cliente final gerenciado por um revendedor Agência — só vendas para clientes aqui contam pra comissão (UX + auditoria, não trava técnica da Kiwify). Distinto de toqy_referrals (bônus único, qualquer indicação).';

-- ============================================
-- 3. toqy_commission_ledger — ledger de comissão por venda
-- ============================================
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

comment on table public.toqy_commission_ledger is
  'Uma linha por venda atribuída a um revendedor — kiwify_order_id UNIQUE garante idempotência (o webhook pode reprocessar o mesmo evento). attribution_status=affiliate_mismatch é auditoria, não bloqueio: fica visível pra reconciliação manual periódica (ver PENDING.md).';

-- ============================================
-- RLS — mesmo padrão de supabase/policies.sql
-- ============================================
alter table public.toqy_resellers enable row level security;
create policy "toqy_resellers_owner_read" on public.toqy_resellers
  for select using (auth.uid() = profile_id);
-- Sem policy de insert/update: convite/ativação é manual (Leonardo cadastra
-- o afiliado na Kiwify e preenche kiwify_affiliate_id) ou via rota de API
-- com service role — nunca direto do client.

alter table public.toqy_managed_clients enable row level security;
create policy "toqy_managed_clients_reseller_read" on public.toqy_managed_clients
  for select using (auth.uid() = reseller_profile_id or auth.uid() = client_profile_id);
-- Sem policy de insert/update client-side: resolver invite_email -> profile
-- exige bypass de RLS de profiles, então a escrita é sempre via
-- POST /api/resellers/clients (service role) ou pelo trigger handle_new_user.

alter table public.toqy_commission_ledger enable row level security;
create policy "toqy_commission_ledger_reseller_read" on public.toqy_commission_ledger
  for select using (auth.uid() = reseller_profile_id);
-- Sem policy de insert: só o webhook (service role) escreve.

-- ============================================
-- 4. Backfill: revendedores legados (compradores de Agência pagamento único)
-- ============================================
-- Mesmo critério da migração da Fase 1: quem já é Agência ativo antes desta
-- migração é necessariamente um comprador de pagamento único (não existia
-- produto recorrente de Agência antes desta fase). Vira revendedor
-- 'pending_invite' — aguardando o Leonardo cadastrar como afiliado na
-- Kiwify manualmente (ver passo manual #2 no plano desta fase). Reaproveita
-- legacy_lifetime_access (coluna da Fase 1, já desenhada genericamente pra
-- isso) — sem mudar nenhum limite/recurso de acesso.
insert into public.toqy_resellers (profile_id, status)
select id, 'pending_invite' from public.profiles
where plan_toqy = 'agency' and subscription_status = 'active'
on conflict (profile_id) do nothing;

update public.profiles
set legacy_lifetime_access = true
where plan_toqy = 'agency' and subscription_status = 'active';

-- Verificação sugerida após rodar (rodar manualmente, conferir antes de seguir):
-- select count(*) from public.toqy_resellers where status = 'pending_invite';

-- ============================================
-- 5. Estende handle_new_user() — vínculo revendedor -> cliente gerenciado
-- ============================================
-- Mesmo padrão já usado pro programa de indicação (ref_code/toqy_referrals)
-- no mesmo bloco: lê managed_by_reseller_code dos metadados de signup,
-- resolve o revendedor pelo reseller_code, e ou completa um convite
-- pendente (client_profile_id era null) ou cria o vínculo direto.
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

  -- Fase 2 do roadmap (2026-07-16) — vínculo de cliente gerenciado.
  if reseller_code_meta is not null then
    select profile_id into reseller_id from public.toqy_resellers where reseller_code = reseller_code_meta;
    if reseller_id is not null and reseller_id <> new.id then
      -- Completa um convite por e-mail pendente (POST /api/resellers/clients),
      -- se existir; senão cria o vínculo direto (veio pelo link ?revenda=).
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

-- Trigger já existe (on_auth_user_created), não precisa recriar — só a
-- função foi substituída (create or replace function acima já é suficiente).
