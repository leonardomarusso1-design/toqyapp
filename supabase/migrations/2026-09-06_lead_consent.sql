-- Migração: governança de consentimento na captura de leads (ebook)
-- Criada: 2026-09-06 (achado P1 de auditoria externa de LGPD/segurança)
--
-- Achado: o formulário do ebook (src/components/EbookLeadForm.tsx +
-- src/app/api/lead/route.ts) gravava só name/email. Não havia checkbox de
-- consentimento, nem finalidade, nem versão do texto aceito, nem data do
-- aceite. A copy "não enviamos spam" é promessa de marketing, não base
-- legal: sem esses campos não há como DEMONSTRAR o consentimento
-- (LGPD art. 8º, §1º) nem responder a um pedido de descadastro/exclusão.
--
-- APLICADA em produção em 2026-09-06 via MCP.
--
-- ACHADO MAIOR, descoberto ao aplicar: a tabela `public.leads` NUNCA
-- EXISTIU no banco. Nenhuma tabela com "lead" no nome existia em nenhum
-- schema. Ou seja, o `insert` da rota /api/lead falhava em 100% das
-- capturas — e, como o código antigo seguia enviando o e-mail mesmo com
-- a gravação falhando (o achado nº 4 da auditoria), o visitante recebia o
-- ebook e o lead era descartado em silêncio. Todos os leads captados até
-- aqui foram perdidos; não há como recuperá-los.
--
-- Isso é exatamente o motivo de "falha de persistência precisa importar":
-- com o erro sendo engolido, um bug que zerava o resultado da isca ficou
-- invisível por tempo indeterminado.
--
-- Compatível com base existente: as colunas nascem nulas, então linhas
-- antigas (se houvesse) continuariam válidas. Ficam com consentimento
-- DESCONHECIDO de propósito — marcar retroativamente como consentido
-- seria inventar prova que nunca existiu.

-- A tabela nunca foi versionada aqui (o código só a referenciava com um
-- comentário "você precisará criá-la no Supabase"), então garantimos a
-- existência antes de alterar.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.leads
  -- Finalidade específica do tratamento (LGPD art. 6º, I): qual isca/campanha
  -- originou o lead. Sem isso não dá para separar quem aceitou receber o
  -- ebook de quem aceitou outra coisa.
  add column if not exists purpose text,
  -- Versão do TEXTO de consentimento efetivamente exibido e aceito.
  -- Ao mudar a redação no formulário, incremente a versão (código: 1.0).
  add column if not exists consent_version text,
  -- Momento do aceite. Separado de created_at porque a linha pode ser
  -- reescrita/importada depois — o aceite tem data própria.
  add column if not exists consented_at timestamptz;

comment on column public.leads.purpose is
  'Finalidade do tratamento declarada no aceite (ex: ebook_7_formas_ganhar_dinheiro_biosites). Nulo = lead legado, anterior a 2026-09-06.';
comment on column public.leads.consent_version is
  'Versão do texto de consentimento aceito pelo titular. Nulo = consentimento não registrado (lead legado).';
comment on column public.leads.consented_at is
  'Data/hora do aceite explícito. Nulo = sem prova de consentimento; não usar para novos disparos sem reconfirmar opt-in.';

-- Consulta usada para auditoria/descadastro por endereço.
create index if not exists leads_email_idx on public.leads (email);

-- RLS ligado sem nenhuma policy = negação por padrão: nenhum papel
-- sujeito a RLS (anon/authenticated) lê ou grava. Só o service_role
-- (usado exclusivamente pela rota /api/lead) enxerga a tabela. Sem isso,
-- uma tabela nova em `public` fica exposta à API REST do Supabase com a
-- chave anônima — e aqui dentro tem nome e e-mail de gente real.
alter table public.leads enable row level security;

comment on table public.leads is
  'Leads capturados pelo ebook. RLS ligado sem policy = negacao por padrao: so o service_role (rota /api/lead) le e grava. Nenhum acesso anonimo/autenticado direto.';
