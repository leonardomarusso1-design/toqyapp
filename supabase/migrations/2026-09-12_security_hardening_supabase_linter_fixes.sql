-- ============================================================
-- MIGRAÇÃO DE SEGURANÇA HARDENING (2026-09-12)
-- Resolve os warnings do linter do Supabase (security advisor):
--
--   1) function_search_path_mutable  → 2 funções (update_updated_at,
--      set_updated_at_toqy) sem SET search_path explícito
--
--   2) anon_security_definer_function_executable  → 10 funções
--      SECURITY DEFINER executáveis por anon via REST /rpc/*
--      (risco de exploração de privilégio elevado por quem não
--      está logado)
--
--   3) authenticated_security_definer_function_executable  → as
--      mesmas 10 funções, executáveis por qualquer usuário logado
--      (risco particularmente grave em apply_pending_plan_after_signup,
--      handle_new_user, protect_profile_sensitive_columns — usuários
--      poderiam autosselecionar plano Freelancer/Agência de graça
--      via RPC direto, sem passar pela Kiwify)
--
--   4) rls_policy_always_true  → policy INSERT pública do
--      toqy_analytics_events usava WITH CHECK (true), qualquer pessoa
--      (anon inclusive) podia inserir linhas forjando o bio_site_id
--      ou profile_id de outro usuário, poluindo a tabela.
--
-- Também resolve 1 warning NÃO do linter mas que a gente já achou:
--   5) is_toqy_admin() grant executado por anon (hoje desnecessário,
--      anon nunca participa das RLS que usam is_toqy_admin()).
-- ============================================================
-- Estratégia para funções SECURITY DEFINER:
--   a) Funções que são chamadas COMO TRIGGER: nenhum usuário
--      (anon/authenticated) PRECISA de grant EXECUTE nenhum. Triggers
--      rodam com privilégio do DONO do trigger independentemente de
--      grants do chamador. Então REVOGAMOS TUDO.
--   b) Funções que são usadas DENTRO DE RLS POLICIES: precisam de
--      EXECUTE pros roles (authenticated geralmente) que participam
--      da policy. Mantemos o grant APENAS pros roles que de fato
--      precisam.
--   c) Funções que são usadas via RPC (supabase.rpc() no código):
--      precisamos de grant apenas pros roles que realmente chamam
--      (ex: verify_biosite_key é chamada por /api/upload-image etc
--      que rodam como service_role — mas também pode ser chamada por
--      autenticado/anon quando necessário).
-- ============================================================

-- ------------------------------------------------------------
-- 1. function_search_path_mutable
--    Recria update_updated_at e set_updated_at_toqy com
--    `set search_path = 'public'` explícito.
--    Obs: se update_updated_at não existir no banco, o create or
--    replace só cria e tá ok. search_path evita trojan-horse via
--    temp tables / objetos criados por usuários antes de chamar.
-- ------------------------------------------------------------

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_updated_at_toqy()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. REVOGAR grants perigosos: primeiro removemos execute de
--    PUBLIC/anon/authenticated de TODAS as funções alvo do warning
--    (isso não afeta triggers, como explicado acima).
--    Usamos REVOKE IF EXISTS para ser idempotente.
-- ------------------------------------------------------------

-- 2a) Funções de TRIGGER (nunca chamadas via RPC, NÃO PRECISAM de
--     grant nenhum pra usuários finais):
revoke all on function public.handle_new_user()            from public, anon, authenticated;
revoke all on function public.apply_pending_plan_after_signup() from public, anon, authenticated;
revoke all on function public.check_biosite_limit()        from public, anon, authenticated;
revoke all on function public.hash_biosite_edit_key()      from public, anon, authenticated;
revoke all on function public.protect_biosite_edit_key()   from public, anon, authenticated;
revoke all on function public.protect_profile_sensitive_columns() from public, anon, authenticated;
revoke all on function public.rls_auto_enable()            from public, anon, authenticated;
revoke all on function public.update_biosites_count()      from public, anon, authenticated;
revoke all on function public.update_updated_at()          from public, anon, authenticated;
revoke all on function public.set_updated_at_toqy()        from public, anon, authenticated;

-- 2b) is_toqy_admin() usada DENTRO DE RLS POLICIES (ex:
--     profiles_admin_read, toqy_support_messages_admin_read/insert).
--     Precisa de EXECUTE para authenticated (usuários logados,
--     donos de mensagens, etc. — a policy só deixa admin passar anyway).
--     NÃO PRECISA para anon (anon nunca participa dessas policies).
revoke all on function public.is_toqy_admin() from public, anon, authenticated;
grant execute  on function public.is_toqy_admin() to authenticated, service_role;

-- 2c) verify_biosite_key() usada VIA RPC (supabase.rpc nas rotas
--     /api/upload-image, /api/upload-audio, /api/upload-video,
--     /api/sites/[slug]/verify-key, /api/biosite/save). Essas rotas
--     hoje usam service_role, mas o design da migration 2026-07-17
--     já previa grant para anon/authenticated também — mantemos
--     (transformar em INVOKER quebraria pois anon não tem SELECT
--     em toqy_biosites). REVOGAMOS de PUBLIC primeiro (pra não
--     ter herança acidental) e depois GRANT EXPLÍCITO nos roles
--     que de fato podem chamar.
revoke all on function public.verify_biosite_key(p_slug text, p_key text)
  from public, anon, authenticated;
grant execute  on function public.verify_biosite_key(p_slug text, p_key text)
  to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 3. rls_policy_always_true → corrigir policy INSERT do
--    toqy_analytics_events.
--    Regra nova:
--      • Se role = service_role → bypass total (WITH CHECK true é ok,
--        pois o service_role sempre vem das nossas rotas de servidor).
--      • Se autenticado → profile_id = auth.uid() (não pode inserir
--        na conta de outra pessoa) E bio_site_id tem que pertencer
--        a um site que ele é dono (impede poluir analytics de site
--        alheio).
--      • Se anônimo → profile_id deve ser NULL (impede se passar por
--        usuário logado) E bio_site_id tem que ser de um site com
--        status='active' (apenas sites públicos).
-- ------------------------------------------------------------

drop policy if exists toqy_analytics_events_public_insert on public.toqy_analytics_events;

create policy toqy_analytics_events_public_insert
  on public.toqy_analytics_events
  for insert
  with check (
    case auth.role()
      when 'service_role' then true                                           -- rotas internas
      when 'authenticated' then
        (profile_id = auth.uid())
        and (
          bio_site_id is null
          or bio_site_id in (select id from public.toqy_biosites where owner_profile_id = auth.uid())
        )
      else -- anon / outros
        profile_id is null
        and (
          bio_site_id is null
          or bio_site_id in (select id from public.toqy_biosites where status = 'active')
        )
    end
  );

-- Garante que authenticated tem permissão de insert se o app passar
-- a escrever analytics direto do navegador (hoje tudo passa por
-- service_role, mas é preventivo):
grant insert on table public.toqy_analytics_events to authenticated;

-- ------------------------------------------------------------
-- 4. Faxina extra (não era warning, mas faz sentido junto):
--    revoke EXECUTE de public nas outras SECURITY DEFINER restantes
--    (por padrão o Postgres cria funções com `EXECUTE ON FUNCTION
--    ... TO PUBLIC` — qualquer role herdado de public consegue
--    chamar). Já tratamos as do warning acima, isso fecha a porta
--    pro resto.
-- ------------------------------------------------------------
revoke execute on function public.apply_agency_commission_referral_if_needed() from public;
revoke execute on function public.notify_reseller_new_managed_client() from public;
