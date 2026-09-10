-- Módulo Placas & Avaliações REMOVIDO do Toqy (2026-09-10).
--
-- Motivo: virou negócio próprio do Leonardo em sociedade (50/50) com marca,
-- Supabase, domínio e financeiro separados do Toqy. O código foi migrado
-- pra um projeto standalone. As tabelas toqy_plate_* nunca tiveram dado
-- (nenhum pedido chegou a ser feito), então o drop é limpo.
--
-- Substitui as migrations 2026-09-10_plate_module_foundation.sql e
-- 2026-09-10_plate_coming_soon.sql (removidas do repo junto).

drop function if exists public.generate_plate_batch(uuid, integer, uuid);
drop function if exists public.toqy_plate_audit_status_change() cascade;
drop table if exists public.toqy_plate_audit_log cascade;
drop table if exists public.toqy_plate_funnel_events cascade;
drop table if exists public.toqy_plate_scan_events cascade;
drop table if exists public.toqy_plate_activations cascade;
drop table if exists public.toqy_plate_destinations cascade;
drop table if exists public.toqy_plate_businesses cascade;
drop table if exists public.toqy_plate_units cascade;
drop table if exists public.toqy_plate_batches cascade;
drop table if exists public.toqy_plate_order_items cascade;
drop table if exists public.toqy_plate_orders cascade;
drop table if exists public.toqy_plate_product_types cascade;
