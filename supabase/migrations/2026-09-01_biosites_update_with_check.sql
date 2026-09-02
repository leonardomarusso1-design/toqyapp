-- Migração: with check em toqy_biosites UPDATE + trava edit_key_hash
-- Criada: 2026-09-01 (auditoria de segurança, skill security-audit)
-- JÁ APLICADA em produção via MCP apply_migration nesta sessão.
--
-- Achado real: "Users can update own biosites" só tinha
-- `using (owner_profile_id = auth.uid())`, sem `with check`. O dono de um
-- bio site podia, via update direto do client, trocar owner_profile_id
-- (transferir o site pra outra conta sem fluxo formal) ou reescrever
-- edit_key_hash manualmente (contornando a geração segura com
-- crypto.getRandomValues -- ver src/lib/security.ts).

drop policy if exists "Users can update own biosites" on public.toqy_biosites;
create policy "Users can update own biosites"
  on public.toqy_biosites
  for update
  to authenticated
  using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());

create or replace function public.protect_biosite_edit_key()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.edit_key_hash := old.edit_key_hash;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_biosite_edit_key_trigger on public.toqy_biosites;
create trigger protect_biosite_edit_key_trigger
before update on public.toqy_biosites
for each row execute function public.protect_biosite_edit_key();
