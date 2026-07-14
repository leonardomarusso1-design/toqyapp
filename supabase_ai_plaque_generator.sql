-- =============================================
-- Toqy — Gerador de arte com IA para plaquinhas (2026-07-13)
-- Rode isso UMA VEZ no SQL Editor do Supabase do projeto Toqy.
--
-- Contexto: o Leonardo pediu um gerador de arte com IA (logo + informações
-- -> a IA cria o design da plaquinha física, editável depois). Diferente
-- do resto do produto, cada geração tem CUSTO REAL variável (chamada à
-- API do Gemini) — e os planos pagos do Toqy são PAGAMENTO ÚNICO (não
-- assinatura recorrente), então "gerações ilimitadas para sempre" por um
-- pagamento único seria risco de prejuízo continuado. Por isso: créditos
-- LIMITADOS por plano (vitalícios, não mensais) — ver PLAN_AI_ART_CREDITS
-- em src/lib/subscriptions.ts para os números por plano.
-- =============================================

alter table profiles add column if not exists ai_art_credits_used integer not null default 0;

comment on column profiles.ai_art_credits_used is
  'Quantas artes de plaquinha já foram geradas por IA — contra o limite vitalício do plano (PLAN_AI_ART_CREDITS). Não reseta mensalmente (planos são pagamento único).';

create table if not exists toqy_plaque_designs (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references profiles(id) on delete cascade,
  biosite_id uuid references toqy_biosites(id) on delete set null,
  plaque_type text not null,      -- 'biosite' | 'pix' | 'wifi' | 'google_review'
  size_label text not null,       -- '10x15' | '5x10' | 'custom'
  business_name text,
  extra_info text,
  logo_url text,
  image_url text,                 -- resultado gerado pela IA (Supabase Storage)
  canvas_data jsonb,              -- estado do editor (camadas de texto/imagem ajustadas depois de gerar) — preenchido por uma fase seguinte, ainda não construída
  status text not null default 'ready', -- 'ready' | 'error'
  error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table toqy_plaque_designs is
  'Artes de plaquinha geradas por IA (Gemini 2.5 Flash Image) — cada linha consome 1 crédito do plano do dono.';

alter table toqy_plaque_designs enable row level security;

-- Mesmo padrão de RLS que profiles já usa neste projeto (auth.uid() direto,
-- não uma função custom tipo my_client_id() — esse é o padrão do ZapFlow,
-- não do Toqy).
create policy "Plaque designs own" on toqy_plaque_designs
  for all using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());

create index if not exists idx_plaque_designs_owner on toqy_plaque_designs (owner_profile_id, created_at desc);
