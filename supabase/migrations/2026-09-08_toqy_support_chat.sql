-- Hub de suporte com chat flutuante (2026-09-08, pedido real: "já
-- criei o hub de admin, com chat flutuante e no admin suporte poder
-- responder as mensagens"). Modelo simples: 1 conversa por usuário
-- (todas as mensagens dele com o suporte, sender indica quem escreveu),
-- só o dono da conta OU um admin conseguem ler/escrever.
--
-- is_admin — sinalizador de quem é dono/operador do Toqy, não do
-- cliente. NUNCA entra no GRANT de UPDATE pro authenticated (mesma
-- lição do achado crítico da auditoria de segurança do mesmo dia:
-- coluna sensível só muda via service_role/SQL direto, nunca client).
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Checagem de admin como função SECURITY DEFINER (roda com privilégio
-- do dono, ignora RLS por dentro). Precisa ser assim, não uma subquery
-- solta em cada policy: uma policy de profiles que consultasse
-- profiles direto DENTRO dela mesma causaria recursão infinita no
-- Postgres (a subquery re-aciona a mesma RLS, que re-aciona a
-- subquery...) — bug real encontrado e corrigido ainda nesta sessão,
-- registrado aqui já na versão certa.
create or replace function public.is_toqy_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create table if not exists public.toqy_support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender text not null check (sender in ('user','admin')),
  message text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists toqy_support_messages_user_id_idx on public.toqy_support_messages (user_id, created_at);

alter table public.toqy_support_messages enable row level security;

-- Dono da conversa: lê e escreve só as próprias mensagens, só como
-- 'user' (nunca pode forjar uma mensagem como se fosse do admin).
create policy toqy_support_messages_owner_read
  on public.toqy_support_messages for select
  using (user_id = auth.uid());
create policy toqy_support_messages_owner_insert
  on public.toqy_support_messages for insert
  with check (user_id = auth.uid() and sender = 'user');

-- Admin (is_admin=true em profiles): lê e escreve em QUALQUER conversa,
-- só como 'admin'.
create policy toqy_support_messages_admin_read
  on public.toqy_support_messages for select
  using (public.is_toqy_admin());
create policy toqy_support_messages_admin_insert
  on public.toqy_support_messages for insert
  with check (sender = 'admin' and public.is_toqy_admin());

grant select, insert on public.toqy_support_messages to authenticated;

comment on table public.toqy_support_messages is
  'Chat de suporte: 1 conversa por usuário (user_id), sender diferencia quem escreveu. RLS: dono só vê/escreve a própria, como "user"; admin (profiles.is_admin) vê/escreve em qualquer uma, como "admin".';

-- ============================================================
-- Admin lê qualquer perfil (pra identificar quem é cada conversa)
-- ============================================================
-- profiles hoje só deixa cada um ler a própria linha (auth.uid() = id).
-- O painel de admin precisa achar nome/e-mail de QUALQUER usuário —
-- sem isso, as conversas apareceriam só com um UUID sem nome nenhum.
-- Usa a mesma is_toqy_admin() de cima (é por isso que ela precisava
-- existir ANTES desta policy e não fazer subquery solta).
create policy profiles_admin_read
  on public.profiles for select
  using (public.is_toqy_admin());

-- Marca a própria conta do Leonardo como admin (ajuste manual, único
-- admin do Toqy hoje — troque o id se a conta mudar).
update public.profiles set is_admin = true where id = 'ac0152fc-ccc9-494c-b3b5-7745391a05ff';
