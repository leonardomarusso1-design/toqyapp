-- =============================================
-- ToqyApp — Programa de indicacao (2026-07-16, pedido do Leonardo)
--
-- Cada usuario ganha um link pessoal de indicacao. Quando alguem se
-- cadastra por esse link E DEPOIS paga qualquer plano do Toqy pela
-- primeira vez, quem indicou ganha +3 bio sites no proprio painel
-- (permanente, somado ao limite do plano — nao expira, nao depende do
-- indicado continuar pagando).
--
-- Reward so dispara no PAGAMENTO (nao no cadastro) de proposito — e o
-- padrao mais seguro contra abuso (criar conta fake nao gera nada),
-- confirmado via pesquisa de mercado (mesmo padrao usado por
-- Dropbox/Grammarly em programas de credito-no-produto).
-- =============================================

alter table profiles add column if not exists referral_code text unique;
alter table profiles add column if not exists referred_by_code text;
alter table profiles add column if not exists referral_bonus_biosites integer not null default 0;

comment on column profiles.referral_code is 'Codigo unico deste usuario pra seu proprio link de indicacao (toqy.com.br/?ref=CODIGO).';
comment on column profiles.referred_by_code is 'Codigo de quem indicou este usuario, capturado no cadastro (?ref= na URL). Null = ninguem indicou.';
comment on column profiles.referral_bonus_biosites is 'Bio sites extras ganhos por indicacao — somado ao limite do plano em checkBiositeLimit(), nunca expira.';

create table if not exists toqy_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid not null references profiles(id) on delete cascade,
  referred_profile_id uuid not null references profiles(id) on delete cascade,
  referral_code text not null,
  converted_at timestamptz,
  rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  unique (referred_profile_id),
  check (referrer_profile_id <> referred_profile_id)
);

create index if not exists toqy_referrals_referrer_idx on toqy_referrals (referrer_profile_id);

grant select on toqy_referrals to anon, authenticated;
grant insert, update on toqy_referrals to authenticated;
grant all on toqy_referrals to service_role;

alter table toqy_referrals enable row level security;

drop policy if exists "toqy_referrals_owner_read" on toqy_referrals;
create policy "toqy_referrals_owner_read" on toqy_referrals
  for select using (auth.uid() = referrer_profile_id or auth.uid() = referred_profile_id);

-- Atualiza o trigger de criacao de perfil pra gravar referred_by_code
-- (vem de raw_user_meta_data, mesmo mecanismo ja usado pra full_name/
-- phone/cpf em supabase.auth.signUp({ options: { data: {...} } })) e
-- criar a linha de rastreio em toqy_referrals quando existir um
-- referrer valido pra esse codigo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  pending record;
  ref_code text;
  referrer_id uuid;
begin
  select * into pending from public.toqy_pending_plans where email = new.email;

  ref_code := new.raw_user_meta_data->>'referred_by_code';

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

  return new;
end;
$function$;
