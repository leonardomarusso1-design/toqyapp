-- =============================================================================
-- Módulo "Placas & Avaliações" — Fase 1 (Fundação)
-- 2026-09-10. Ver .planning/PLAN_MODULO_PLACAS_AVALIACOES.md
--
-- Produto lateral do Toqy: placas físicas (cartão / adesivo 10x10 / L 10x15)
-- com QR Code + NFC apontando pra avaliação do Google, via link DINÂMICO
-- (toqy.com.br/r/{public_token} -> redirect). Separado logicamente dos
-- biosites: prefixo próprio `toqy_plate_`, tabelas próprias, RLS própria.
-- Compartilha só a auth Supabase e a instância do banco.
--
-- Convenção do projeto: este Supabase NÃO tem grant automático pra role
-- nenhuma (ver histórico grant_service_role_*), então TODA tabela leva
-- GRANT explícito. RLS ligado em tudo. Escrita: só service_role (as rotas
-- de API validam dono/pagamento antes). Leitura: dono via RLS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Catálogo de produtos físicos
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  format text not null check (format in ('business_card', 'square_10', 'l_stand_10x15', 'other')),
  technology text not null default 'qr_nfc' check (technology in ('qr', 'nfc', 'qr_nfc')),
  unit_price numeric not null default 0,          -- Leonardo ajusta no admin depois
  active boolean not null default true,
  stock_quantity integer,                          -- null = sem controle de estoque
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.toqy_plate_product_types enable row level security;
grant select on public.toqy_plate_product_types to anon, authenticated;
grant all on public.toqy_plate_product_types to service_role;

-- Leitura pública só dos ativos (a landing/wizard lista sem login)
drop policy if exists toqy_plate_product_types_public_read on public.toqy_plate_product_types;
create policy toqy_plate_product_types_public_read
  on public.toqy_plate_product_types for select
  using (active = true);

-- ---------------------------------------------------------------------------
-- 2) Pedidos
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_orders (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  order_type text not null check (order_type in ('individual', 'reseller')),
  status text not null default 'draft' check (status in (
    'draft', 'pending_payment', 'paid', 'processing', 'manufacturing',
    'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'
  )),
  payment_status text not null default 'pending' check (payment_status in (
    'pending', 'paid', 'failed', 'refunded'
  )),
  subtotal numeric not null default 0,
  shipping_cost numeric not null default 0,        -- frete sempre grátis no MVP (embutido no preço)
  discount numeric not null default 0,
  total numeric not null default 0,
  shipping_snapshot jsonb,                          -- nome, endereço, CEP, telefone congelados
  customer_notes text,
  provider text,                                    -- 'appmax' | 'mock'
  provider_order_id text,
  tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toqy_plate_orders_owner_idx on public.toqy_plate_orders (owner_profile_id);
create index if not exists toqy_plate_orders_provider_idx on public.toqy_plate_orders (provider, provider_order_id);

alter table public.toqy_plate_orders enable row level security;
grant select on public.toqy_plate_orders to authenticated;
grant all on public.toqy_plate_orders to service_role;

drop policy if exists toqy_plate_orders_owner_read on public.toqy_plate_orders;
create policy toqy_plate_orders_owner_read
  on public.toqy_plate_orders for select
  using (owner_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3) Itens do pedido (preço congelado no momento da compra)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.toqy_plate_orders(id) on delete cascade,
  product_type_id uuid not null references public.toqy_plate_product_types(id),
  quantity integer not null check (quantity > 0),
  unit_price_snapshot numeric not null,
  batch_id uuid,                                    -- fk lógica (evita ciclo de fk), preenchida no pedido reseller
  created_at timestamptz not null default now()
);

create index if not exists toqy_plate_order_items_order_idx on public.toqy_plate_order_items (order_id);

alter table public.toqy_plate_order_items enable row level security;
grant select on public.toqy_plate_order_items to authenticated;
grant all on public.toqy_plate_order_items to service_role;

drop policy if exists toqy_plate_order_items_owner_read on public.toqy_plate_order_items;
create policy toqy_plate_order_items_owner_read
  on public.toqy_plate_order_items for select
  using (order_id in (select id from public.toqy_plate_orders where owner_profile_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 4) Lotes (pedido reseller gera um lote com N unidades)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique,                  -- 'LOTE-' + 8 chars aleatórios (não sequencial)
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.toqy_plate_orders(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  activated_quantity integer not null default 0,
  status text not null default 'reserved' check (status in (
    'reserved', 'manufacturing', 'in_stock', 'shipped', 'delivered', 'cancelled'
  )),
  generated_at timestamptz,                         -- só preenche depois do pagamento confirmado
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists toqy_plate_batches_order_uidx on public.toqy_plate_batches (order_id);
create index if not exists toqy_plate_batches_buyer_idx on public.toqy_plate_batches (buyer_profile_id);

alter table public.toqy_plate_batches enable row level security;
grant select on public.toqy_plate_batches to authenticated;
grant all on public.toqy_plate_batches to service_role;

drop policy if exists toqy_plate_batches_owner_read on public.toqy_plate_batches;
create policy toqy_plate_batches_owner_read
  on public.toqy_plate_batches for select
  using (buyer_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5) Unidade individual (o "cartão" físico)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_units (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.toqy_plate_batches(id) on delete cascade,  -- null em pedido individual
  order_id uuid not null references public.toqy_plate_orders(id) on delete cascade,
  product_type_id uuid not null references public.toqy_plate_product_types(id),
  internal_serial integer not null,                 -- numerinho impresso no canto da peça (sequencial dentro do lote/pedido)
  public_token text not null unique,                -- vai no QR e no NFC: toqy.com.br/r/{public_token}
  activation_code_hash text,                        -- bcrypt do código de ativação; null em pedido individual (já nasce ativado)
  activation_code_last4 text,                       -- só pra exibir "•••• 4821"
  status text not null default 'reserved' check (status in (
    'reserved', 'manufacturing', 'in_stock', 'shipped',
    'available_for_activation', 'activated', 'suspended', 'cancelled', 'blocked'
  )),
  activated_at timestamptz,
  activated_by_profile_id uuid references public.profiles(id),
  final_business_id uuid,                           -- fk lógica -> toqy_plate_businesses
  failed_activation_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toqy_plate_units_batch_idx on public.toqy_plate_units (batch_id);
create index if not exists toqy_plate_units_order_idx on public.toqy_plate_units (order_id);
create index if not exists toqy_plate_units_token_idx on public.toqy_plate_units (public_token);

alter table public.toqy_plate_units enable row level security;
grant select on public.toqy_plate_units to authenticated;
grant all on public.toqy_plate_units to service_role;

-- Dono da unidade = dono do pedido (comprador individual OU revendedor dono do lote)
drop policy if exists toqy_plate_units_owner_read on public.toqy_plate_units;
create policy toqy_plate_units_owner_read
  on public.toqy_plate_units for select
  using (order_id in (select id from public.toqy_plate_orders where owner_profile_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 6) Negócio final vinculado à placa
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  google_place_id text,
  google_business_name text,
  google_review_url text,
  business_name text not null,
  category text,
  logo_url text,
  phone text,
  whatsapp text,
  address text,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists toqy_plate_businesses_owner_idx on public.toqy_plate_businesses (owner_profile_id);

alter table public.toqy_plate_businesses enable row level security;
grant select on public.toqy_plate_businesses to authenticated;
grant all on public.toqy_plate_businesses to service_role;

drop policy if exists toqy_plate_businesses_owner_read on public.toqy_plate_businesses;
create policy toqy_plate_businesses_owner_read
  on public.toqy_plate_businesses for select
  using (owner_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7) Histórico de destino da unidade (NUNCA sobrescreve — sempre append)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_destinations (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.toqy_plate_units(id) on delete cascade,
  destination_url text not null,
  destination_type text not null default 'google_review' check (destination_type in ('google_review', 'custom')),
  is_active boolean not null default true,          -- só 1 ativo por unit (garantido no código da API)
  changed_by_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists toqy_plate_destinations_unit_idx on public.toqy_plate_destinations (unit_id);
create index if not exists toqy_plate_destinations_active_idx on public.toqy_plate_destinations (unit_id) where is_active = true;

alter table public.toqy_plate_destinations enable row level security;
grant select on public.toqy_plate_destinations to authenticated;
grant all on public.toqy_plate_destinations to service_role;

drop policy if exists toqy_plate_destinations_owner_read on public.toqy_plate_destinations;
create policy toqy_plate_destinations_owner_read
  on public.toqy_plate_destinations for select
  using (unit_id in (
    select u.id from public.toqy_plate_units u
    join public.toqy_plate_orders o on o.id = u.order_id
    where o.owner_profile_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 8) Registro de ativação
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_activations (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.toqy_plate_units(id) on delete cascade,
  business_id uuid not null references public.toqy_plate_businesses(id),
  reseller_profile_id uuid references public.profiles(id),
  activation_code_last4 text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists toqy_plate_activations_unit_idx on public.toqy_plate_activations (unit_id);

alter table public.toqy_plate_activations enable row level security;
grant select on public.toqy_plate_activations to authenticated;
grant all on public.toqy_plate_activations to service_role;

drop policy if exists toqy_plate_activations_owner_read on public.toqy_plate_activations;
create policy toqy_plate_activations_owner_read
  on public.toqy_plate_activations for select
  using (reseller_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9) Eventos de scan (métrica não-invasiva, sem PII)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_scan_events (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.toqy_plate_units(id) on delete cascade,
  event_type text not null check (event_type in ('qr_scan', 'nfc_open', 'redirect', 'activation_page_view')),
  referrer text,
  device_type text,
  created_at timestamptz not null default now()
);

create index if not exists toqy_plate_scan_events_unit_idx on public.toqy_plate_scan_events (unit_id, created_at);

alter table public.toqy_plate_scan_events enable row level security;
grant all on public.toqy_plate_scan_events to service_role;
-- Sem grant pra anon/authenticated: só o servidor grava (rota /r/[token]) e lê (admin).

-- ---------------------------------------------------------------------------
-- 10) Eventos de funil (conversão da landing/wizard)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_funnel_events (
  id uuid primary key default gen_random_uuid(),
  session_key text,                                 -- id anônimo de sessão do navegador (não PII)
  event_type text not null,                         -- landing_view, click_individual, click_reseller, business_search, ...
  profile_id uuid references public.profiles(id),   -- preenchido se logado
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists toqy_plate_funnel_events_type_idx on public.toqy_plate_funnel_events (event_type, created_at);

alter table public.toqy_plate_funnel_events enable row level security;
grant all on public.toqy_plate_funnel_events to service_role;

-- ---------------------------------------------------------------------------
-- 11) Auditoria (toda transição de estado relevante)
-- ---------------------------------------------------------------------------
create table if not exists public.toqy_plate_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),  -- null = ação de sistema/webhook
  entity_type text not null,                             -- 'order' | 'unit' | 'batch' | ...
  entity_id uuid not null,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index if not exists toqy_plate_audit_log_entity_idx on public.toqy_plate_audit_log (entity_type, entity_id, created_at);

alter table public.toqy_plate_audit_log enable row level security;
grant all on public.toqy_plate_audit_log to service_role;

-- ---------------------------------------------------------------------------
-- Trigger de auditoria: grava mudança de status de order/unit/batch
-- ---------------------------------------------------------------------------
create or replace function public.toqy_plate_audit_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.toqy_plate_audit_log (entity_type, entity_id, action, before, after)
    values (
      tg_argv[0],
      new.id,
      'status_change',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists toqy_plate_orders_audit on public.toqy_plate_orders;
create trigger toqy_plate_orders_audit
  after update on public.toqy_plate_orders
  for each row execute function public.toqy_plate_audit_status_change('order');

drop trigger if exists toqy_plate_units_audit on public.toqy_plate_units;
create trigger toqy_plate_units_audit
  after update on public.toqy_plate_units
  for each row execute function public.toqy_plate_audit_status_change('unit');

drop trigger if exists toqy_plate_batches_audit on public.toqy_plate_batches;
create trigger toqy_plate_batches_audit
  after update on public.toqy_plate_batches
  for each row execute function public.toqy_plate_audit_status_change('batch');

-- ---------------------------------------------------------------------------
-- Função transacional: gera um lote de N unidades pra um pedido reseller.
-- Idempotente (falha se o pedido já tem lote). Tokens/códigos gerados no
-- banco com aleatoriedade criptográfica + retry anti-colisão. Retorna os
-- códigos EM TEXTO PURO uma única vez (o chamador mostra/entrega e nunca
-- mais consegue de volta — só o hash fica gravado).
-- ---------------------------------------------------------------------------
create or replace function public.generate_plate_batch(
  p_order_id uuid,
  p_quantity integer,
  p_product_type_id uuid
)
returns table (internal_serial integer, activation_code text, public_token text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_order public.toqy_plate_orders%rowtype;
  v_batch_id uuid;
  v_batch_code text;
  v_token text;
  v_code text;
  i integer;
  -- alfabeto sem 0/O/1/I/L pra código digitado por gente
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  select * into v_order from public.toqy_plate_orders where id = p_order_id;
  if not found then raise exception 'pedido % nao existe', p_order_id; end if;
  if v_order.order_type <> 'reseller' then raise exception 'pedido % nao e reseller', p_order_id; end if;
  if v_order.payment_status <> 'paid' then raise exception 'pedido % nao esta pago', p_order_id; end if;
  if exists (select 1 from public.toqy_plate_batches where order_id = p_order_id) then
    raise exception 'pedido % ja tem lote gerado', p_order_id;
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 100000 then
    raise exception 'quantidade invalida: %', p_quantity;
  end if;

  -- batch_code: LOTE- + 8 chars do alfabeto seguro
  loop
    v_batch_code := 'LOTE-' || (
      select string_agg(substr(v_alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(v_alphabet)), 1), '')
      from generate_series(1, 8)
    );
    exit when not exists (select 1 from public.toqy_plate_batches where batch_code = v_batch_code);
  end loop;

  insert into public.toqy_plate_batches (batch_code, buyer_profile_id, order_id, quantity, status, generated_at)
  values (v_batch_code, v_order.owner_profile_id, p_order_id, p_quantity, 'manufacturing', now())
  returning id into v_batch_id;

  for i in 1..p_quantity loop
    loop
      -- token público: 20 chars url-safe (base32-ish com alfabeto seguro)
      v_token := (
        select string_agg(substr(v_alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(v_alphabet)), 1), '')
        from generate_series(1, 20)
      );
      -- código de ativação: 8 chars do alfabeto seguro
      v_code := (
        select string_agg(substr(v_alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(v_alphabet)), 1), '')
        from generate_series(1, 8)
      );
      begin
        insert into public.toqy_plate_units (
          batch_id, order_id, product_type_id, internal_serial,
          public_token, activation_code_hash, activation_code_last4, status
        ) values (
          v_batch_id, p_order_id, p_product_type_id, i,
          v_token, crypt(v_code, gen_salt('bf')), right(v_code, 4), 'available_for_activation'
        );
        exit;  -- inseriu, sai do loop de retry
      exception when unique_violation then
        -- colisão de token (praticamente impossível) — gera outro e tenta de novo
      end;
    end loop;

    internal_serial := i;
    activation_code := v_code;
    public_token := v_token;
    return next;
  end loop;
end;
$$;

revoke all on function public.generate_plate_batch(uuid, integer, uuid) from public;
grant execute on function public.generate_plate_batch(uuid, integer, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Seed dos 3 produtos iniciais (só avaliação Google, arte padrão, sem logo).
-- unit_price = 0: Leonardo define no admin depois de estudar custo/mercado.
-- ---------------------------------------------------------------------------
insert into public.toqy_plate_product_types (name, slug, description, format, technology, unit_price, active)
values
  ('Cartão de visita', 'cartao-de-visita', 'Cartão no tamanho de cartão de visita, com QR Code e chip NFC pra avaliação no Google.', 'business_card', 'qr_nfc', 0, true),
  ('Plaquinha quadrada 10x10', 'plaquinha-quadrada-10x10', 'Adesiva, 10x10 cm, pra colar no balcão ou parede. QR Code + NFC.', 'square_10', 'qr_nfc', 0, true),
  ('Plaquinha 10x15 em L', 'plaquinha-l-10x15', 'De mesa, formato L, 10x15 cm. QR Code + NFC.', 'l_stand_10x15', 'qr_nfc', 0, true)
on conflict (slug) do nothing;

comment on table public.toqy_plate_product_types is 'Catálogo de produtos físicos do módulo Placas & Avaliações. Leitura pública só ativos; escrita só admin (service_role).';
comment on table public.toqy_plate_units is 'Unidade física individual (cartão/plaquinha). public_token vai no QR/NFC (rota /r/{token}). activation_code_hash nunca em texto puro — o texto só sai 1x na geração do lote.';
comment on function public.generate_plate_batch is 'Gera lote de N unidades pra um pedido reseller pago. Idempotente. Retorna os códigos de ativação em texto puro UMA vez.';
