-- Correção: erro "Column reference 'plan_tier' is ambiguous" ao salvar biosite
-- Criada: 2026-07-18
--
-- Contexto: a trigger trg_check_biosite_limit (migration
-- 2026-07-17_biosite_limit_trigger.sql) dispara no INSERT de toqy_biosites e
-- chama check_biosite_limit(), que faz:
--   select plan_toqy, plan_tier, biosites_limit, referral_bonus_biosites, overage_biosites
--     into p
--     from public.profiles
--     where id = new.owner_profile_id;
-- Em algumas instalações do Supabase, o PostgREST/PostgreSQL reclama de
-- "Column reference 'plan_tier' is ambiguous" — possivelmente porque
-- `plan_tier` existe em mais de uma tabela/view exposta no search_path, ou
-- por uma versão antiga da função ainda em cache. A query original também
-- não qualifica `id` na cláusula WHERE (que pode colidir com `new.id` da
-- trigger). Esta migration reescreve a função qualificando TODAS as
-- colunas com o alias `pr` da tabela profiles, e remove `plan_tier` do
-- SELECT (já que só `plan_toqy` é usado de fato — plan_tier é legado e
-- só lido em fallback no client, não no banco).

create or replace function public.check_biosite_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pr record;
  v_plan text;
  v_plan_default_limit int;
  v_effective_limit int;
  v_current_count int;
begin
  -- Busca APENAS as colunas necessárias, todas qualificadas com o alias `pr`.
  -- plan_tier foi REMOVIDO do SELECT pra evitar qualquer ambiguidade — o
  -- banco só precisa de plan_toqy (campo real, atualizado pelo Kiwify).
  select pr2.plan_toqy, pr2.biosites_limit, pr2.referral_bonus_biosites, pr2.overage_biosites
    into pr
    from public.profiles as pr2
    where pr2.id = new.owner_profile_id;

  v_plan := coalesce(pr.plan_toqy, 'free');

  -- Espelha PLAN_BIOSITE_LIMITS em src/lib/planLimits.ts.
  v_plan_default_limit := case v_plan
    when 'community' then 10
    when 'freelancer' then 20
    when 'agency' then 100
    else 1
  end;

  v_effective_limit := coalesce(nullif(pr.biosites_limit, 0), v_plan_default_limit)
    + coalesce(pr.referral_bonus_biosites, 0)
    + coalesce(pr.overage_biosites, 0);

  select count(*) into v_current_count
  from public.toqy_biosites as tb
  where tb.owner_profile_id = new.owner_profile_id;

  if v_current_count >= v_effective_limit then
    raise exception 'Limite de % bio sites do plano atingido', v_effective_limit
      using errcode = 'P0001', hint = 'biosite_limit_exceeded';
  end if;

  return new;
end;
$$;

-- Recria a trigger apontando pra função atualizada (idempotente).
drop trigger if exists trg_check_biosite_limit on public.toqy_biosites;
create trigger trg_check_biosite_limit
  before insert on public.toqy_biosites
  for each row
  execute function public.check_biosite_limit();

-- Verificação sugerida após rodar (manualmente no SQL Editor):
-- select proname, prosrc from pg_proc where proname = 'check_biosite_limit';
-- -- o prosrc deve mostrar a versão com `pr2.` e sem `plan_tier` no SELECT.
