-- Migração: limite de bio sites por plano, aplicado no banco (fecha gap de
-- segurança real, achado na auditoria de 2026-07-17)
-- Criada: 2026-07-17
--
-- NÃO APLICAR AUTOMATICAMENTE. Revisar e rodar manualmente (SQL Editor do
-- Supabase, ou via MCP com autorização explícita do Leonardo no momento).
--
-- Contexto: o limite de bio sites por plano (1 grátis / 10 Essencial / 20
-- Freelancer / 100 Agência, mais bônus de indicação/excedente) só era
-- checado no navegador (checkBiositeLimit() em src/lib/planLimits.ts,
-- chamado antes de SiteBuilder.tsx tentar salvar). O INSERT real em
-- toqy_biosites acontece DIRETO do cliente (syncBiositeToSupabase() em
-- src/lib/biositeSync.ts) — a policy RLS de insert só verifica
-- owner_profile_id = auth.uid(), sem checar quota nenhuma. Um usuário
-- autenticado podia chamar a API REST do Supabase direto (com o próprio
-- JWT, sem passar pela UI) e criar bio sites ilimitados no plano
-- gratuito — bypass completo do paywall principal do produto.
--
-- Fix: trigger BEFORE INSERT em toqy_biosites que recalcula o limite
-- efetivo (mesma fórmula de checkBiositeLimit(), plan_tier + bônus de
-- indicação + excedente avulso) e bloqueia o insert se já estiver no
-- limite — não importa qual caminho de código tenta inserir, o banco
-- é a última linha de defesa.

create or replace function public.check_biosite_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p record;
  plan_tier text;
  plan_default_limit int;
  effective_limit int;
  current_count int;
begin
  select plan_toqy, plan_tier, biosites_limit, referral_bonus_biosites, overage_biosites
    into p
    from public.profiles
    where id = new.owner_profile_id;

  plan_tier := coalesce(p.plan_toqy, p.plan_tier, 'free');

  -- Espelha PLAN_BIOSITE_LIMITS em src/lib/planLimits.ts — se um número
  -- mudar lá, precisa mudar aqui também (não há forma de compartilhar essa
  -- constante entre TS e SQL nesta stack).
  plan_default_limit := case plan_tier
    when 'community' then 10
    when 'freelancer' then 20
    when 'agency' then 100
    else 1
  end;

  -- Mesma fórmula de checkBiositeLimit(): biosites_limit (se setado) ou o
  -- padrão do plano, mais bônus de indicação, mais excedente avulso comprado.
  effective_limit := coalesce(nullif(p.biosites_limit, 0), plan_default_limit)
    + coalesce(p.referral_bonus_biosites, 0)
    + coalesce(p.overage_biosites, 0);

  select count(*) into current_count
  from public.toqy_biosites
  where owner_profile_id = new.owner_profile_id;

  if current_count >= effective_limit then
    raise exception 'Limite de % bio sites do plano atingido', effective_limit
      using errcode = 'P0001', hint = 'biosite_limit_exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_biosite_limit on public.toqy_biosites;
create trigger trg_check_biosite_limit
  before insert on public.toqy_biosites
  for each row
  execute function public.check_biosite_limit();

-- Verificação sugerida após rodar (rodar manualmente):
-- select count(*) from public.toqy_biosites; -- número não deve mudar, é só trigger novo
-- Testar: logar com uma conta free (limite 1) que já tem 1 bio site e
-- tentar criar outro pela UI normal — deve continuar bloqueando como
-- sempre bloqueou (client-side), e agora também bloquearia mesmo
-- pulando a UI.
