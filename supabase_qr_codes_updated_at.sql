-- =============================================
-- ToqyApp — updated_at em toqy_qr_codes (2026-07-15)
-- Já aplicado direto via MCP Supabase — este arquivo é só o registro/histórico.
--
-- Pedido do Leonardo: editar um QR/Pix já salvo (chave, nome, valor etc.)
-- SEM trocar o link/slug que já está gravado na tag NFC ou impresso na
-- plaquinha. Rota PATCH /api/qr-codes/[id] usa este updated_at.
-- =============================================

alter table toqy_qr_codes add column if not exists updated_at timestamptz not null default now();

drop trigger if exists toqy_qr_codes_set_updated_at on toqy_qr_codes;
create trigger toqy_qr_codes_set_updated_at
  before update on toqy_qr_codes
  for each row execute function set_updated_at_toqy();
