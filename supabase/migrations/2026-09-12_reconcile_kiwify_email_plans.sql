-- Reconciliação de compras Kiwify por e-mail (2026-09-12)
--
-- O webhook e a rota de reconcile agora comparam e-mails sem diferenciar
-- maiúsculas/minúsculas. Este backfill é idempotente e corrige os casos
-- reportados pelo proprietário sem depender de uma nova compra/login.

begin;

-- Normaliza pendências antigas para que o trigger de criação de perfil e a
-- reconciliação encontrem o mesmo e-mail usado pela Kiwify.
update public.toqy_pending_plans
set email = lower(trim(email))
where email is not null and email <> lower(trim(email));

-- Compra aprovada do Freelancer: ativa a conta se ela já existir.
update public.profiles
set plan_toqy = 'freelancer',
    biosites_limit = 20,
    plan_toqy_since = coalesce(plan_toqy_since, now()),
    plan_toqy_expires_at = null,
    subscription_status = 'active',
    updated_at = now()
where lower(trim(email)) = 'lucasxmarciel@gmail.com';

-- Compra aprovada do Pro (R$9,90): ativa a conta se ela já existir.
update public.profiles
set plan_toqy = 'pro',
    biosites_limit = 1,
    plan_toqy_since = coalesce(plan_toqy_since, now()),
    plan_toqy_expires_at = null,
    subscription_status = 'active',
    updated_at = now()
where lower(trim(email)) = 'caimanplatina@gmail.com';

-- Se a conta ainda não existir, preserve a compra para ser aplicada no
-- primeiro cadastro/login com esse mesmo e-mail.
insert into public.toqy_pending_plans (email, plan_toqy, biosites_limit)
select 'lucasxmarciel@gmail.com', 'freelancer', 20
where not exists (select 1 from public.profiles where lower(trim(email)) = 'lucasxmarciel@gmail.com')
on conflict (email) do update set plan_toqy = excluded.plan_toqy, biosites_limit = excluded.biosites_limit;

insert into public.toqy_pending_plans (email, plan_toqy, biosites_limit)
select 'caimanplatina@gmail.com', 'pro', 1
where not exists (select 1 from public.profiles where lower(trim(email)) = 'caimanplatina@gmail.com')
on conflict (email) do update set plan_toqy = excluded.plan_toqy, biosites_limit = excluded.biosites_limit;

-- Reembolso informado: remove qualquer pendência e deixa a conta sem plano
-- pago, sem apagar biosites ou dados do usuário.
update public.profiles
set plan_toqy = 'free',
    biosites_limit = 1,
    plan_toqy_expires_at = now(),
    subscription_status = 'canceled',
    updated_at = now()
where lower(trim(email)) = 'jonathan.optica@gmail.com';

delete from public.toqy_pending_plans
where lower(trim(email)) = 'jonathan.optica@gmail.com';

-- O trigger original já aplica pendências em instalações novas. Este trigger
-- complementar roda depois que a linha de profile existir, usa lower() e
-- cobre cadastros antigos cujo auth.users.email preservou maiúsculas, sem
-- depender de o cliente abrir o app para reconciliar.
create or replace function public.apply_pending_plan_after_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare pending record;
begin
  select plan_toqy, biosites_limit into pending
  from public.toqy_pending_plans
  where lower(trim(email)) = lower(trim(new.email))
  limit 1;

  if pending.plan_toqy is not null then
    update public.profiles
    set plan_toqy = pending.plan_toqy,
        biosites_limit = pending.biosites_limit,
        plan_toqy_since = now(),
        plan_toqy_expires_at = null,
        subscription_status = 'active',
        updated_at = now()
    where id = new.id;

    delete from public.toqy_pending_plans
    where lower(trim(email)) = lower(trim(new.email));
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_apply_pending_plan on public.profiles;
create trigger on_profile_apply_pending_plan
after insert on public.profiles
for each row execute function public.apply_pending_plan_after_signup();

commit;
