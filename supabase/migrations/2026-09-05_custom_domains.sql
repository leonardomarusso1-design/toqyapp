-- Migração: domínio próprio (feature Agência, prometida na landing desde
-- sempre em subscriptions.ts/page.tsx mas nunca implementada — achado real
-- da sessão 2026-09-05, mesma categoria do bug de white label).
--
-- Um bio site pode ter um domínio externo (ex: meunegocio.com.br) apontado
-- pra ele via CNAME. status:
--   'pending'  -> domínio cadastrado no TOQY e na Vercel, aguardando o
--                 cliente configurar o CNAME no provedor de DNS dele
--   'verified' -> Vercel confirmou o CNAME, domínio serve o bio site
--   'error'    -> Vercel rejeitou (domínio já em uso por outro projeto, etc.)

alter table public.toqy_biosites
  add column if not exists custom_domain text,
  add column if not exists custom_domain_status text;

-- unique parcial: cada domínio só pode apontar pra UM bio site por vez,
-- mas múltiplos bio sites sem domínio (null) não colidem entre si.
create unique index if not exists toqy_biosites_custom_domain_key
  on public.toqy_biosites (custom_domain)
  where custom_domain is not null;

create index if not exists idx_toqy_biosites_custom_domain_lookup
  on public.toqy_biosites (custom_domain)
  where custom_domain_status = 'verified';

-- Achado real (mesma auditoria, 2026-09-05): a política de leitura pública
-- de biosites (ver biositeSync.ts comentário linha ~107) só libera por
-- slug com status=active. O lookup por domínio próprio no middleware usa o
-- client ADMIN (service_role, bypassa RLS) — igual /b/[slug]/page.tsx já
-- faz — então nenhuma política nova é necessária aqui.
