-- ============================================
-- Seed Data - Production Demo Only
-- ============================================
-- This seed file initializes the database with the official demo biosite.
-- Run only on fresh database initialization.

-- Insert organization for demo
insert into public.organizations (id, name, email, phone, address, website, status)
values (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Espaço Andrian',
  'contato@espacoandrian.com.br',
  '+55 19 99262-4655',
  'R. Santo Antônio, 170 Centro, Vargem Grande do Sul - SP',
  'https://www.instagram.com/barbearia_andrian/',
  'active'
)
on conflict (id) do nothing;

-- Insert barbearia-andrian biosite
insert into public.bio_sites (
  id, 
  organization_id,
  slug, 
  business_name, 
  description, 
  segment,
  profile_data,
  theme,
  buttons,
  catalog,
  catalog_layout,
  pix_config,
  wifi_config,
  status, 
  is_public, 
  edit_key
)
values (
  'demo-barbearia-id-uuid-here-1234567890ab',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'barbearia-andrian',
  'Espaço Andrian',
  'Barbearia & Estética. Agende seu horário, acesse o Wi-Fi ou pague no Pix com facilidade.',
  'barbearia',
  jsonb_build_object(
    'name', 'Espaço Andrian',
    'title', 'Barbearia & Estética',
    'description', 'Barbearia & Estética. Agende seu horário, acesse o Wi-Fi ou pague no Pix com facilidade.',
    'location', 'R. Santo Antônio, 170 Centro, Vargem Grande do Sul - SP',
    'logoUrl', '/images/logo.jpeg',
    'profileImageUrl', '/images/logo.jpeg',
    'backgroundImageUrl', '/templates/template-bg-barbearia.png',
    'logoSize', 'large',
    'logoShape', 'circle'
  ),
  jsonb_build_object(
    'mode', 'dark',
    'backgroundType', 'image',
    'background', '#050a12',
    'gradientFrom', '#050a12',
    'gradientTo', '#152033',
    'card', 'rgba(15, 23, 42, 0.86)',
    'text', '#f8fafc',
    'muted', '#cbd5e1',
    'primary', '#D4AF37',
    'secondary', '#111827',
    'accent', '#FACC15',
    'buttonFill', 'glass',
    'buttonStyle', 'full',
    'buttonRadius', 'pill',
    'useBackgroundOverlay', true
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'barbearia-whatsapp', 'label', 'WhatsApp', 'type', 'whatsapp', 'enabled', true),
    jsonb_build_object('id', 'barbearia-instagram', 'label', 'Instagram', 'type', 'instagram', 'enabled', true),
    jsonb_build_object('id', 'barbearia-maps', 'label', 'Como chegar', 'type', 'maps', 'enabled', true),
    jsonb_build_object('id', 'barbearia-wifi', 'label', 'Wi-Fi: Barbearia Andrian', 'type', 'wifi', 'enabled', true),
    jsonb_build_object('id', 'barbearia-booking', 'label', 'Agendar horário', 'type', 'booking', 'enabled', true),
    jsonb_build_object('id', 'barbearia-review', 'label', 'Avalie no Google', 'type', 'review', 'enabled', true),
    jsonb_build_object('id', 'barbearia-pix', 'label', 'Chave Pix', 'type', 'pix', 'enabled', true),
    jsonb_build_object('id', 'barbearia-catalog', 'label', 'Nossos Serviços / Cortes', 'type', 'catalog', 'enabled', true)
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'corte',
      'name', 'Corte Masculino',
      'description', 'Corte de cabelo impecável e finalizado do seu jeito.',
      'price', 'R$ 40,00',
      'imageUrl', '/images/corte_cabelo.jpg',
      'imageLayout', 'horizontal',
      'category', 'Cortes',
      'enabled', true,
      'actionLabel', 'Agendar horário',
      'actionUrl', 'https://booksy.com/'
    ),
    jsonb_build_object(
      'id', 'barba',
      'name', 'Barba',
      'description', 'Modelagem, acabamento e toalha quente para um visual alinhado.',
      'price', 'R$ 35,00',
      'imageUrl', '/images/barba_terapia.jpg',
      'imageLayout', 'horizontal',
      'category', 'Barba',
      'enabled', true,
      'actionLabel', 'Agendar horário',
      'actionUrl', 'https://booksy.com/'
    ),
    jsonb_build_object(
      'id', 'combo',
      'name', 'Corte + Barba',
      'description', 'Combo completo com corte, barba e finalização premium.',
      'price', 'R$ 70,00',
      'imageUrl', '/images/combo_corte_barba.jpg',
      'imageLayout', 'horizontal',
      'category', 'Combos',
      'enabled', true,
      'actionLabel', 'Agendar horário',
      'actionUrl', 'https://booksy.com/'
    )
  ),
  'stack',
  jsonb_build_object(
    'enabled', true,
    'key', '26287678801',
    'receiver', 'Espaço Andrian',
    'bank', 'Pix',
    'quickAmounts', jsonb_build_array(35, 55, 80),
    'allowCustomAmount', true,
    'whatsappProofNumber', '5519992624655'
  ),
  jsonb_build_object(
    'enabled', true,
    'ssid', 'Barbearia Andrian',
    'password', 'recorecobolao',
    'encryption', 'WPA'
  ),
  'active',
  true,
  '8392-1147'
)
on conflict (slug) do nothing;

-- Create subscription for demo organization
insert into public.subscriptions (
  id,
  organization_id,
  plan_type,
  max_sites,
  status,
  current_period_start,
  current_period_end
)
values (
  'demo-sub-uuid-here-1234567890ab12345',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'free',
  1,
  'active',
  now(),
  now() + interval '1 year'
)
on conflict (id) do nothing;

-- Note: This seed is idempotent - it will not fail if records already exist
