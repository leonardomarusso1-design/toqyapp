-- Reserva excluível pelo dono (2026-09-08, pedido ao vivo: painel de
-- Agendamentos sem nenhuma ação, "quero ter acesso, pode excluir,
-- responder..."). A exclusão passa por /api/bookings/[id]/route.ts
-- (service_role, depois de validar dono) — mesma lacuna de GRANT já
-- corrigida antes pra select/insert em toqy_bookings/toqy_leads
-- (aplicada direto via MCP num diagnóstico anterior, sem migration
-- registrada): service_role tem bypass de RLS mas não de GRANT de
-- tabela, e delete nunca tinha sido concedido.
grant delete on public.toqy_bookings to service_role;
