-- ============================================================
-- MIGRAÇÃO CRÍTICA (2026-09-12)
-- Corrige 3 bugs de produção que impediram ativação de planos:
--
-- BUG 1: CHECK constraint em profiles.plan_toqy NÃO incluía 'pro'
--        → Qualquer compra do plano Pro (R$9,90) falhava silenciosamente
--          ao gravar plan_toqy='pro' no banco (violava CHECK).
-- BUG 2: Comparação de email no handle_new_user() era CASE-SENSITIVE
--        → Usuário comprava com "lucasxmarciel@gmail.com" (caixa baixa),
--          criava conta com "LucasxMarciel@gmail.com" (ou vice-versa),
--          e o plano pendente (toqy_pending_plans) NUNCA era aplicado.
-- BUG 3: Falta normalização de email em toqy_pending_plans
--        → Garantir que email sempre é lower(trim()) antes de gravar.
-- BÔNUS: Ativação manual dos usuários afetados reportados:
--        - lucasxmarciel@gmail.com → freelancer
--        - caimanplatina@gmail.com → pro (R$9,90)
--        - jonathan.optica@gmail.com → usuário pediu reembolso, então
--          NÃO ativamos, apenas documentamos.
-- ============================================================

-- ------------------------------------------------------------
-- PASSO 1: Remover constraint CHECK antiga e recriar incluindo 'pro'
-- ------------------------------------------------------------
do $$
begin
  -- Tenta remover a constraint antiga se existir
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'profiles'
      and constraint_name like '%plan_toqy_check%'
  ) then
    alter table public.profiles
      drop constraint if exists profiles_plan_toqy_check;
  end if;
end $$;

-- Recria a CHECK com 'pro' incluso
alter table public.profiles
  add constraint profiles_plan_toqy_check
  check (plan_toqy in ('free', 'pro', 'community', 'freelancer', 'agency'));

-- ------------------------------------------------------------
-- PASSO 2: Garantir que toqy_pending_plans.email é sempre lower(trim())
-- ------------------------------------------------------------
-- Normaliza dados já existentes (por precaução)
update public.toqy_pending_plans
  set email = lower(trim(email))
  where email <> lower(trim(email));

-- ------------------------------------------------------------
-- PASSO 3: Reescrever handle_new_user() para usar lower(email)
--           na comparação com toqy_pending_plans e também em
--           profiles.email (para on conflict idempotência).
--           Também aplica lower(trim()) em todos os emails
--           antes de gravar.
-- ------------------------------------------------------------
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
  normalized_email text;
begin
  normalized_email := lower(trim(new.email));

  -- Compara usando lower() BILATERALMENTE — agora independe de caixa
  -- (seja no email da Kiwify ou no email digitado no signup)
  select * into pending
    from public.toqy_pending_plans
    where lower(trim(email)) = normalized_email;

  ref_code := new.raw_user_meta_data->>'referred_by_code';
  reseller_code_meta := new.raw_user_meta_data->>'managed_by_reseller_code';

  insert into public.profiles (id, email, full_name, phone, cpf, plan_tier, plan_toqy, biosites_limit, subscription_status, referred_by_code, updated_at)
  values (
    new.id,
    normalized_email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(normalized_email, '@', 1)),
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

  -- Limpa o pendente — tambem usa lower()
  if pending.email is not null then
    delete from public.toqy_pending_plans
      where lower(trim(email)) = normalized_email;
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
        and lower(trim(invite_email)) = normalized_email;

      insert into public.toqy_managed_clients (reseller_profile_id, client_profile_id, reseller_code, status)
      values (reseller_id, new.id, reseller_code_meta, 'active')
      on conflict (client_profile_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- Re-cria o trigger (drop + create por se tratar de mudança na função)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- PASSO 4: BÔNUS — ativar usuários reportados (service_role only)
--           Primeiro tenta encontrar o profile.id via auth.users
--           (email lowerizado), depois atualiza profiles.
-- ------------------------------------------------------------
do $$
declare
  v_userid_lucas uuid;
  v_userid_caiman uuid;
begin
  -- 4a. lucasxmarciel@gmail.com → FREELANCER (comprou primeiro, depois criou conta)
  select id into v_userid_lucas
    from auth.users
    where lower(trim(email)) = 'lucasxmarciel@gmail.com';

  if v_userid_lucas is not null then
    -- Garante que o profile existe antes (se por acaso handle_new_user não rodou)
    insert into public.profiles (id, email, plan_toqy, biosites_limit, subscription_status, plan_toqy_since, updated_at)
    values (v_userid_lucas, 'lucasxmarciel@gmail.com', 'freelancer', 20, 'active', now(), now())
    on conflict (id) do update set
      plan_toqy = 'freelancer',
      biosites_limit = 20,
      subscription_status = 'active',
      plan_toqy_since = coalesce(profiles.plan_toqy_since, now()),
      plan_toqy_expires_at = null,
      updated_at = now();

    -- Remove qualquer pending plan remanescente (por limpeza)
    delete from public.toqy_pending_plans where lower(trim(email)) = 'lucasxmarciel@gmail.com';
  end if;

  -- 4b. caimanplatina@gmail.com → PRO R$9,90 (comprou e não ativou por causa da CHECK)
  select id into v_userid_caiman
    from auth.users
    where lower(trim(email)) = 'caimanplatina@gmail.com';

  if v_userid_caiman is not null then
    insert into public.profiles (id, email, plan_toqy, biosites_limit, subscription_status, plan_toqy_since, updated_at)
    values (v_userid_caiman, 'caimanplatina@gmail.com', 'pro', 1, 'active', now(), now())
    on conflict (id) do update set
      plan_toqy = 'pro',
      biosites_limit = 1,
      subscription_status = 'active',
      plan_toqy_since = coalesce(profiles.plan_toqy_since, now()),
      plan_toqy_expires_at = null,
      updated_at = now();

    delete from public.toqy_pending_plans where lower(trim(email)) = 'caimanplatina@gmail.com';
  end if;

  -- 4c. jonathan.optica@gmail.com → PEDIU REEMBOLSO, NÃO ATIVAMOS
  --     (apenas limpamos pending_plan se existir para não ser aplicado por acaso depois)
  delete from public.toqy_pending_plans where lower(trim(email)) = 'jonathan.optica@gmail.com';
end $$;
