-- =============================================
-- ToqyApp — QR Codes avulsos persistidos (link publico pra NFC) +
-- numeracao discreta sequencial em artes e QR codes (2026-07-14)
--
-- Pedido do Leonardo: (1) link publico pra Pix/QR personalizado, pra
-- gravar num chip NFC (NFC grava link, nao imagem/texto solto — sem
-- pagina publica o QR gerado no /app/qr era so uma prevalencia efemera
-- na tela, sem link nenhum pra colocar na tag); (2) numeracao discreta
-- sequencial em toda arte e todo QR gerado, pra rastrear/gerenciar
-- pecas fisicas individualmente (mesmo padrao usado por concorrente
-- "Vision Local" — numero pequeno no canto da placa fisica, ligado a um
-- registro individual gerenciavel).
-- =============================================

-- 1) Numeracao sequencial por usuario em toqy_plaque_designs (artes de IA)
alter table toqy_plaque_designs add column if not exists seq_number integer;

-- 2) Nova tabela: QR codes avulsos persistidos (Pix ou link personalizado)
create table if not exists toqy_qr_codes (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references profiles(id) on delete cascade,
  seq_number integer not null,
  slug text not null unique,
  mode text not null check (mode in ('pix', 'link')),
  label text,
  pix_key text,
  pix_receiver_name text,
  pix_city text,
  pix_amount numeric,
  target_url text,
  created_at timestamptz not null default now()
);

create index if not exists toqy_qr_codes_owner_idx on toqy_qr_codes (owner_profile_id);

-- Mesmo padrao de GRANTs explicitos que o resto deste projeto usa (nao
-- existe grant automatico pra role nenhuma nesse projeto Supabase — ver
-- supabase_ai_plaque_generator_grants.sql pro mesmo problema encontrado
-- antes com toqy_plaque_designs).
grant select on toqy_qr_codes to anon, authenticated;
grant insert, update, delete on toqy_qr_codes to authenticated;
grant all on toqy_qr_codes to service_role;

alter table toqy_qr_codes enable row level security;

-- Dono gerencia os proprios QR codes
drop policy if exists "toqy_qr_codes_owner_all" on toqy_qr_codes;
create policy "toqy_qr_codes_owner_all" on toqy_qr_codes
  for all using (auth.uid() = owner_profile_id) with check (auth.uid() = owner_profile_id);

-- Leitura publica por slug (pagina /qr/[slug] precisa ser acessivel sem
-- login — e o link que vai pra dentro da tag NFC, escaneado pelo cliente
-- final, que nunca esta autenticado no Toqy)
drop policy if exists "toqy_qr_codes_public_read" on toqy_qr_codes;
create policy "toqy_qr_codes_public_read" on toqy_qr_codes
  for select using (true);
