-- Migração: flag de add-on de domínio próprio pro plano Pro Pessoal
-- Criada: 2026-09-05 (segmentação de público — Pro Pessoal + Agência)
--
-- Diferente do domínio próprio da Agência (incluso na assinatura,
-- controlado só por plan_toqy='agency'), o Pro Pessoal precisa comprar o
-- domínio à parte (compra avulsa anual via Kiwify, ver OVERAGE_LINKS
-- .customDomain em subscriptions.ts). Esse flag registra que a compra foi
-- feita — sem ele, /api/domains recusa mesmo com plano Pro ativo.

alter table public.profiles
  add column if not exists custom_domain_addon boolean not null default false;
