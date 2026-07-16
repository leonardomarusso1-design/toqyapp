-- Migração: hash de verdade pra edit_key_hash (fecha achado #2 da
-- auditoria de 2026-07-17 — coluna se chamava "hash" mas guardava a chave
-- em texto puro, nunca foi hasheada de fato)
-- Criada: 2026-07-17
--
-- NÃO APLICAR AUTOMATICAMENTE. Revisar e rodar manualmente (SQL Editor do
-- Supabase, ou via MCP com autorização explícita do Leonardo no momento).
--
-- Contexto: o item 1 (mesma auditoria) já fechou o vazamento de
-- edit_key_hash pro navegador — mas a coluna em si continuava guardando a
-- chave em texto puro no banco. Isso ainda é um risco de defesa em
-- profundidade (qualquer acesso direto ao banco, um bug futuro, ou um
-- backup vazado exporia todas as chaves de uma vez). Esta migração:
--
-- 1. Habilita pgcrypto (já vem disponível no Supabase, só precisa ligar).
-- 2. Cria um trigger que hasheia edit_key_hash automaticamente (bcrypt,
--    via crypt()/gen_salt('bf')) toda vez que a coluna é setada — insert
--    de site novo continua passando a chave em texto puro no código (não
--    precisou mudar biositeSync.ts nem api/biosites/route.ts), o banco
--    hasheia sozinho antes de gravar. Protegido contra hashear duas vezes
--    (regex verifica se já está no formato bcrypt $2a$/$2b$/$2y$).
-- 3. Roda um UPDATE "no-op" (edit_key_hash = edit_key_hash) só pra disparar
--    o trigger em TODAS as linhas existentes — converte as chaves em texto
--    puro de hoje pra hash, numa passada só.
-- 4. Cria verify_biosite_key(slug, key) — função que compara a chave sem
--    nunca precisar trazer o hash pro código JS. As rotas que hoje fazem
--    `existing.edit_key_hash !== editKey` (api/biosite/save,
--    api/sites/[slug]/verify-key, api/upload-image, api/biosites/[slug])
--    passam a chamar essa função via supabase.rpc() em vez de comparar
--    direto — muda o "onde compara", não o "quem pode entrar".

create extension if not exists pgcrypto;

create or replace function public.hash_biosite_edit_key()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.edit_key_hash is not null and new.edit_key_hash !~ '^\$2[aby]\$' then
    new.edit_key_hash := extensions.crypt(new.edit_key_hash, extensions.gen_salt('bf'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hash_biosite_edit_key on public.toqy_biosites;
create trigger trg_hash_biosite_edit_key
  before insert or update of edit_key_hash on public.toqy_biosites
  for each row
  execute function public.hash_biosite_edit_key();

-- Backfill: dispara o trigger acima pra toda linha existente, convertendo
-- a chave em texto puro de hoje pra hash bcrypt.
update public.toqy_biosites set edit_key_hash = edit_key_hash;

create or replace function public.verify_biosite_key(p_slug text, p_key text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.toqy_biosites
    where slug = p_slug
      and edit_key_hash = extensions.crypt(p_key, edit_key_hash)
  );
$$;

grant execute on function public.verify_biosite_key(text, text) to anon, authenticated, service_role;

-- Verificação sugerida após rodar (rodar manualmente):
-- select edit_key_hash from public.toqy_biosites limit 3;
-- -- deve começar com $2a$ ou $2b$, não mais 4 dígitos-4 dígitos-4 dígitos.
