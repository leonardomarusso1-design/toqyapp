# TOQY — auditoria de estabilização (pré-Supabase)

Auditoria sem reconstrução do projeto, sem alterar o visual aprovado, sem tocar no
design público de `/b/:slug`, sem conectar Supabase e sem autenticação real. Foco em
bugs funcionais, rotas, assets, salvamento em localStorage/mock e pequenos ajustes
técnicos para preparar a próxima fase de integrações.

## 1. Arquivos duplicados/mortos removidos

- `src/components/EditBioSiteClient.tsx` — duplicava (com UI diferente) a mesma
  lógica de desbloqueio por chave que já existe em `src/app/editar/[slug]/page.tsx`.
  Não era importado por nenhuma rota. Removido.
- `src/components/PhoneMockup.tsx` — componente de mockup antigo, não usado em
  nenhuma página, e referenciava classes Tailwind que não existem mais
  (`gold-500`, `night-850`, etc.). Removido.
- `src/components/PlaquePreview.tsx` — não usado em nenhuma página. Removido.
- `src/components/ButtonLink.tsx` — não usado em nenhuma página. Removido.
- `src/lib/pix.ts`, `src/lib/wifi.ts`, `src/lib/qr.ts`, `src/lib/slug.ts` — arquivos
  "stub" sem uso real (a lógica real de Pix/Wi-Fi/QR/slug já vive em
  `src/lib/buttonUtils.ts` e `src/lib/security.ts`). Removidos.
- `src/lib/utils.ts` — funções não usadas (`cn`, `getSiteBackground`,
  `buildToqyWhatsappUrl`, `buildToqyWifiQrValue`, `generateMockPixCode`), só
  consumidas pelos componentes removidos acima. Removido.
- `src/app/api/sites/[slug]/route.ts` — era uma cópia quase idêntica de
  `src/app/api/sites/[slug]/verify-key/route.ts` (mesmo POST de verificação de
  chave, na rota errada). Reescrito como `GET /api/sites/:slug`, devolvendo os
  dados mock do site (consistente com `GET /api/sites`). Essa rota não é chamada
  pelo app hoje (tudo roda em localStorage), mas ficou coerente para uso futuro.

## 2. "2 Pix" na edição (corrigido)

Na etapa **Links e Botões** do editor, o tipo de botão tinha duas opções de Pix
("Pix" e "Pix Hub") que abriam exatamente o **mesmo modal** "Pix inteligente" no
bio site público — confuso e duplicado.

- `src/lib/buttonSync.ts`: removida a opção **"Pix Hub"** da lista de tipos de
  botão (`buttonTypeOptions`). Agora só existe **"Pix"**, que abre o Pix
  inteligente (chave, QR Code, valores rápidos e comprovante).
- `src/components/ButtonEditor.tsx`: textos de ajuda atualizados para refletir
  isso. Botões antigos salvos com `type: "pixHub"` continuam funcionando (tratados
  como Pix inteligente, compatibilidade mantida), só não aparecem mais como opção
  nova no seletor.
- `src/app/[slug]/pix/page.tsx` (rota legada "Pix Hub" de página cheia) estava
  **só funcionando para os sites mock** (`getMockSiteBySlug`), ou seja, quebrava
  para qualquer bio site criado pelo usuário. Criado
  `src/components/StoredPixHub.tsx` (mesmo padrão do `StoredPublicBioSite`) para
  ler também do localStorage via `getSiteBySlug`. A rota `/[slug]/pix` agora
  funciona tanto para mocks quanto para bio sites criados.

## 3. Pix inteligente — melhoria

- `src/components/PublicBioSite.tsx` (`PixModal`): o botão "Já paguei / enviar
  comprovante" só aparecia se `pix.whatsappProofNumber` estivesse preenchido.
  Agora há fallback automático para `contact.whatsapp` e depois `contact.phone`,
  então o botão aparece mesmo que o campo específico do Pix não tenha sido
  configurado.

## 4. Wi-Fi com check-in — melhoria

- `src/components/PublicBioSite.tsx` (`WifiModal`): quando `wifi.checkinLabel`
  está vazio, o rótulo do botão "Depois de conectar" agora é inferido
  automaticamente a partir da origem do link de check-in:
  - link de check-in próprio → "Fazer check-in"
  - avaliação Google → "Avaliar no Google"
  - Facebook → "Curtir no Facebook"
  - Instagram → "Seguir no Instagram"
  - fallback → "Fazer check-in / avaliar" (texto antigo)

## 5. Catálogo flexível — mais próximo da imagem da landing

Sem mudar cores, fontes ou a estrutura geral aprovada do bio site, o
`CatalogSection`/`CatalogCard` em `src/components/PublicBioSite.tsx` ganhou:

- **Subtítulo** abaixo de "Produtos e serviços" ("Selecionados para você..."),
  como na imagem `landing-feature-catalogo.png`.
- **Chips de categorias** com rolagem horizontal ("Todas" + cada categoria
  cadastrada no item), permitindo filtrar o catálogo — igual à seção
  "Categorias" da landing. Só aparece quando há mais de uma categoria.
- **Ação dupla por item**: além do botão de ação configurado (ex.: "Agendar",
  "Comprar"), agora há um ícone de WhatsApp ao lado, abrindo conversa direta —
  igual ao par "ícone WhatsApp + Comprar" da imagem.
- **CTA final** "Não encontrou o que procura? Fale com a gente no WhatsApp" no
  fim da seção de catálogo, quando o WhatsApp estiver configurado.
- Todos os layouts existentes continuam funcionando: `carousel`, `grid`,
  `stack`, `grouped` e `category-carousel`. O catálogo, o carrossel, o grid e as
  categorias **não foram removidos**, apenas reorganizados/filtráveis.

## 6. Outros ajustes técnicos pequenos

- `src/app/app/novo/page.tsx`: `createSiteFromSegmentTemplate(...)` agora é
  chamado dentro de `useState(() => ...)` (inicialização tardia), evitando gerar
  um novo `id`/`editKey` aleatório em cada re-render do componente.
- `src/app/layout.tsx`: `metadataBase` agora cai para `https://<VERCEL_URL>`
  quando `NEXT_PUBLIC_APP_URL` não está definida (antes caía sempre para
  `http://localhost:3000`, o que deixava as imagens de Open Graph com URL
  incorreta em produção na Vercel).

## 7. Onde os dados são lidos e salvos hoje (mapa para a próxima fase)

- `src/lib/mockSites.ts` — bio sites de demonstração fixos no código (somente
  leitura): `barbearia-andrian`, `pastel-da-praca`, `my-cell`, `salao-demo`,
  `clinica-demo`, `loja-demo`.
- `src/lib/siteStorage.ts` — bio sites criados/editados pelo usuário, persistidos
  em `window.localStorage` na chave `toqy_sites_v4`. Também guarda em
  `toqy_deleted_mock_sites_v1` quais sites mock foram "excluídos" pelo painel
  (tombstone local).
- `src/lib/dataProvider.ts` — ponto único usado pelas páginas (`/app`,
  `/app/novo`, `/app/qr`, `/me`, `/editar/[slug]`) para listar, criar, salvar,
  duplicar, pausar/publicar e excluir bio sites, e validar a chave de acesso do
  cliente. Por cima, mescla mocks + localStorage via `mergeMockAndStoredSites()`.
- Documentado em comentário no topo de `dataProvider.ts` o contrato sugerido para
  uma futura implementação `dataProvider.supabase.ts` com as mesmas assinaturas
  de função (sem nenhuma conexão, tabela ou autenticação criada nesta revisão).

## Testes executados

```bash
npm run lint
npm run build
npm run start -- -p 4311
```

Rotas testadas com `curl` (todas retornando HTTP 200):

- `/`
- `/app`
- `/app/novo`
- `/app/qr`
- `/me`
- `/b/barbearia-andrian`
- `/b/pastel-da-praca`
- `/b/my-cell`
- `/editar/barbearia-andrian`
- `/barbearia-andrian` (rota legada `/[slug]`)
- `/barbearia-andrian/pix` (Pix Hub legado, agora também lê localStorage)
- `/salao-demo/pix`
- `/b/nao-existe` (mostra corretamente "Bio site não encontrado")
- `/api/sites`
- `/api/sites/barbearia-andrian`

Assets confirmados em produção (200): `/favicon.png`, `/favicon.ico`,
`/brand/favicon-toqy.png`, `/brand/logo-toqy-horizontal-dark.png`,
`/brand/logo-toqy-horizontal-white.png`, `/brand/toqy-icon-transparent.png`,
`/images/landing-hero-toqy.png`, `/images/landing-feature-catalogo.png`,
`/images/logo.jpeg`, `/templates/template-bg-barbearia.png`,
`/templates/catalog/food-pastel.svg`.

## O que ainda falta antes do Supabase

1. Testar manualmente no navegador o fluxo completo de criação em `/app/novo` →
   salvar → ver no painel `/app` → abrir `/b/:slug` → editar em `/editar/:slug`
   → confirmar que o preview do editor bate com o bio site público (mesmos
   dados, mesmo componente `PublicBioSite`).
2. `saveStoredSite` faz merge por `id` OU por `slug`. Se o usuário criar dois
   bio sites em `/app/novo` sem alterar o nome padrão "Novo negócio" antes de
   salvar, ambos terão o slug `novo-negocio` e o segundo salvamento vai
   sobrescrever o primeiro no localStorage (mesmo slug, ids diferentes). Não é
   um bug novo desta revisão, mas vale resolver (ex.: gerar slug com sufixo
   único) antes de abrir para múltiplos usuários.
3. Definir e configurar `NEXT_PUBLIC_APP_URL` (ou confiar em `VERCEL_URL`) no
   ambiente da Vercel para que as imagens de Open Graph/compartilhamento usem o
   domínio correto.
4. Avaliar upload real de imagens (Storage) — hoje `ImageUploadField` aceita
   apenas URLs.
5. Criar `dataProvider.supabase.ts` seguindo o contrato documentado em
   `src/lib/dataProvider.ts`, com tabelas para sites, botões e catálogo, e regras
   de RLS, antes de qualquer autenticação real.
6. Repetir a auditoria de assets sempre que novos templates por segmento forem
   adicionados, garantindo que todo `backgroundImageUrl`/`imageUrl` referenciado
   em `segmentTemplates.ts` e `mockSites.ts` exista em `public/`.
