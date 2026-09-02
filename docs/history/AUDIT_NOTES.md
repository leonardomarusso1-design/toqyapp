# AUDIT_NOTES

## Auditoria de estabilizacao

Auditoria sem reconstrucao do projeto, sem alterar o visual aprovado, sem tocar no design publico de `/b/:slug`, sem conectar Supabase e sem autenticacao real. Foco em bugs funcionais, rotas, assets, salvamento em localStorage/mock e pequenos ajustes tecnicos para preparar a proxima fase.

## Duplicacoes e arquivos antigos tratados

- `src/components/EditBioSiteClient.tsx`: componente antigo duplicado em relacao a `src/app/editar/[slug]/page.tsx`; mantida a remocao vinda do remoto.
- `src/components/PhoneMockup.tsx`, `src/components/PlaquePreview.tsx`, `src/components/ButtonLink.tsx`: componentes antigos sem uso; mantida a remocao vinda do remoto.
- Helpers antigos sem uso direto foram removidos no remoto; a camada ativa agora concentra dados em `src/lib/dataProvider/`.

## Foco da camada de dados

Auditoria exclusiva da camada de dados do TOQY para preparar futura integracao com Supabase, sem conectar Supabase, sem instalar biblioteca, sem criar login real, sem remover mocks e sem quebrar localStorage.

## Onde os dados estavam antes

- `src/lib/mockSites.ts`: dados mockados dos bio sites de demonstracao.
- `src/lib/siteStorage.ts`: leitura, escrita, merge de mocks com localStorage, validacao de chave e URLs publicas/de edicao.
- Telas como `/app`, `/app/qr`, `/me`, `/editar/[slug]`, bio site publico e Pix Hub chamavam partes dessa logica diretamente ou parcialmente por um provider antigo em `src/lib/dataProvider.ts`.
- Algumas APIs simples ainda liam `mockSites` diretamente.

## O que foi centralizado

- Criada a pasta `src/lib/dataProvider/`.
- Criado `src/lib/dataProvider/types.ts` com os tipos principais:
  - `BioSite`
  - `Client`
  - `CatalogItem`
  - `SiteButton`
  - `PixConfig`
  - `WifiConfig`
  - `ClientKey`
  - `DataProvider`
- Criado `src/lib/dataProvider/localProvider.ts` encapsulando:
  - listagem de bio sites;
  - busca por id;
  - busca por slug;
  - criacao;
  - salvamento;
  - exclusao;
  - publicar;
  - pausar;
  - duplicar;
  - validacao de chave do cliente;
  - geracao de URL publica;
  - geracao de URL de edicao.
- Criado `src/lib/dataProvider/index.ts` como ponto unico de exportacao do provider ativo.
- O provider local continua usando as mesmas chaves de localStorage:
  - `toqy_sites_v4`
  - `toqy_deleted_mock_sites_v1`

## Arquivos alterados na camada de dados

- `src/lib/dataProvider/types.ts`
- `src/lib/dataProvider/localProvider.ts`
- `src/lib/dataProvider/index.ts`
- `src/app/app/page.tsx`
- `src/app/app/novo/page.tsx`
- `src/app/app/qr/page.tsx`
- `src/app/me/page.tsx`
- `src/app/editar/[slug]/page.tsx`
- `src/app/[slug]/page.tsx`
- `src/app/[slug]/pix/page.tsx`
- `src/app/b/[slug]/page.tsx`
- `src/app/api/sites/route.ts`
- `src/app/api/sites/[slug]/route.ts`
- `src/app/api/sites/[slug]/verify-key/route.ts`
- `src/components/SiteBuilder.tsx`
- `src/components/StoredPublicBioSite.tsx`
- `src/components/StoredPixHub.tsx`

## O que continua igual

- Os mocks continuam existindo em `src/lib/mockSites.ts`.
- O localStorage continua funcionando.
- As URLs publicas continuam no formato `/b/:slug`.
- A edicao por chave continua usando a chave mock/local.
- Nenhum login real foi criado.
- Nenhum Supabase foi conectado.
- Nenhuma biblioteca Supabase foi instalada.

## O que falta para conectar Supabase

- Criar um provider Supabase com a mesma interface de `DataProvider`.
- Mapear `BioSite`, `CatalogItem`, `SiteButton`, `PixConfig` e `WifiConfig` para tabelas reais.
- Definir RLS e politicas de leitura publica por slug.
- Criar API/server actions para escrita segura.
- Trocar o provider ativo em `src/lib/dataProvider/index.ts` quando o ambiente Supabase estiver pronto.
- Migrar a chave de cliente para hash/validacao server-side.

## Testes executados

- `npm run build`
- Rotas checadas localmente: `/app`, `/app/novo`, `/app/qr`, `/me`, `/b/barbearia-andrian`, `/editar/barbearia-andrian`.
