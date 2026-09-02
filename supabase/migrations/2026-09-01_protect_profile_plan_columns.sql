-- Migração: fecha auto-upgrade de plano via RLS incompleta
-- Criada: 2026-09-01 (auditoria de segurança, skill security-audit)
-- JÁ APLICADA em produção via MCP apply_migration nesta sessão --
-- este arquivo é o registro/histórico, igual ao padrão já usado em
-- supabase_qr_codes_updated_at.sql.
--
-- Achado real: "Users can update own profile" só tinha
-- `using (auth.uid() = id)`, sem `with check` restringindo colunas. RLS
-- do Postgres é por LINHA, não por coluna -- qualquer usuário autenticado
-- podia rodar, direto do console do navegador:
--   supabase.from('profiles').update({plan_toqy:'agency', biosites_limit:100})
-- e se autopromover de plano grátis pra pago de graça. A policy de INSERT
-- tinha o mesmo problema (with check (true) -- nem checava auth.uid()=id).

create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    new.plan_toqy := 'free';
    new.plan_tier := 'free';
    new.biosites_limit := 1;
    new.biosites_count := 0;
    new.subscription_status := 'active';
    new.plan_toqy_since := null;
    new.plan_toqy_expires_at := null;
    new.kiwify_order_id_toqy := null;
    new.kiwify_customer_id := null;
    new.has_ebook := false;
    new.has_kit := false;
    new.ai_art_credits_used := 0;
    new.referral_bonus_biosites := 0;
    new.legacy_lifetime_access := false;
    new.overage_biosites := 0;
    new.overage_ai_art_credits := 0;
  else
    new.plan_toqy := old.plan_toqy;
    new.plan_tier := old.plan_tier;
    new.biosites_limit := old.biosites_limit;
    new.biosites_count := old.biosites_count;
    new.subscription_status := old.subscription_status;
    new.plan_toqy_since := old.plan_toqy_since;
    new.plan_toqy_expires_at := old.plan_toqy_expires_at;
    new.kiwify_order_id_toqy := old.kiwify_order_id_toqy;
    new.kiwify_customer_id := old.kiwify_customer_id;
    new.has_ebook := old.has_ebook;
    new.has_kit := old.has_kit;
    new.ai_art_credits_used := old.ai_art_credits_used;
    new.referral_bonus_biosites := old.referral_bonus_biosites;
    new.legacy_lifetime_access := old.legacy_lifetime_access;
    new.overage_biosites := old.overage_biosites;
    new.overage_ai_art_credits := old.overage_ai_art_credits;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_columns_trigger on public.profiles;
create trigger protect_profile_sensitive_columns_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_sensitive_columns();

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to anon, authenticated
  with check (auth.uid() = id);
