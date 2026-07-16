-- Migração: cobrança de excedente avulsa (fecha pendência da Fase 2 do
-- roadmap — ver .planning/ROADMAP.md, Phase 2 "Pendente (manual, fora de
-- código)")
-- Criada: 2026-07-17
--
-- NÃO APLICAR AUTOMATICAMENTE. Revisar e rodar manualmente (SQL Editor do
-- Supabase, ou via MCP com autorização explícita do Leonardo no momento).
--
-- Contexto: Freelancer que bate no limite de bio sites ou créditos de arte
-- pode comprar +1 avulso via Kiwify (R$2,99 bio site / R$5,99 arte) sem
-- fazer upgrade de plano inteiro. Segue o MESMO padrão aditivo já usado por
-- referral_bonus_biosites (nunca sobrescrito, sempre somado ao limite do
-- plano em checkBiositeLimit()/checkAiArtCredits(), ver
-- src/lib/planLimits.ts) — não um sistema de créditos/wallet novo.

alter table public.profiles
  add column if not exists overage_biosites integer not null default 0;

comment on column public.profiles.overage_biosites is
  'Bio sites extras comprados avulsos (R$2,99/un via Kiwify, produto "TOQY - Bio Site Extra") — somado ao limite do plano em checkBiositeLimit() junto com referral_bonus_biosites. Nunca expira, não reseta em renovação. Só vendido pro Freelancer (Agência já tem limite generoso, 100 sites).';

alter table public.profiles
  add column if not exists overage_ai_art_credits integer not null default 0;

comment on column public.profiles.overage_ai_art_credits is
  'Créditos de arte com IA extras comprados avulsos (R$5,99/un via Kiwify, produto "TOQY - Crédito de Arte Extra") — somado ao limite do plano em checkAiArtCredits() antes de comparar com ai_art_credits_used. Nunca expira/reseta, mesmo padrão vitalício de ai_art_credits_used. Vendido pro Freelancer e pra Agência.';

-- Sem backfill necessário — default 0 já é o valor correto pra toda linha
-- existente (ninguém tinha comprado excedente antes desta feature existir).
