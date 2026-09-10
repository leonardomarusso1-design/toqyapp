-- Módulo Placas — flag "em breve" no produto (2026-09-10, decisão do
-- Leonardo: lançar já com Cartão de visita + Plaquinha 10x10; a Plaquinha
-- em L fica visível na landing como "em breve", não pedível ainda).
--
-- active = true + coming_soon = true → aparece no catálogo/landing, mas
-- o wizard não deixa comprar (checado no código, Fase 2).

alter table public.toqy_plate_product_types
  add column if not exists coming_soon boolean not null default false;

update public.toqy_plate_product_types
  set coming_soon = true
  where slug = 'plaquinha-l-10x15';

update public.toqy_plate_product_types
  set coming_soon = false
  where slug in ('cartao-de-visita', 'plaquinha-quadrada-10x10');
