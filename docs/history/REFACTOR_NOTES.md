# REFACTOR_NOTES

## Problemas encontrados

- Textos visiveis com acentos quebrados em builder, painel, QR, rota do cliente e bio site publico.
- Dashboard `/app` ainda estava com cara de lista simples, sem metricas, acoes de gestao e niveis futuros.
- Tela `/app/qr` tinha botao de download sem acao real e textos desalinhados com a proposta da pagina.
- Rota dinamica `/:slug` apontava para Pix Hub, o que podia quebrar links publicos fora de `/b/:slug`.
- Catalogo tinha suporte visual ao modo agrupado, mas o tipo ainda nao aceitava `category-carousel`.
- Dados e operacoes de bio site estavam espalhados entre mocks/localStorage, dificultando a futura troca para Supabase.
- Alguns operadores `??` foram restaurados apos limpeza de encoding, evitando regressao de preview e formulario.

## Arquivos alterados

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/app/page.tsx`
- `src/app/app/novo/page.tsx`
- `src/app/app/qr/page.tsx`
- `src/app/[slug]/page.tsx`
- `src/app/[slug]/pix/page.tsx`
- `src/app/me/page.tsx`
- `src/app/editar/[slug]/page.tsx`
- `src/components/DashboardShell.tsx`
- `src/components/PublicBioSite.tsx`
- `src/components/SiteBuilder.tsx`
- `src/components/StoredPublicBioSite.tsx`
- `src/components/PhoneMockup.tsx`
- `src/lib/types.ts`
- `src/lib/dataProvider.ts`
- `src/lib/slug.ts`
- `src/lib/pix.ts`
- `src/lib/wifi.ts`
- `src/lib/qr.ts`

## Melhorias feitas

- Fontes globais padronizadas com `Inter` para corpo e `Space Grotesk` para titulos, usando `.font-body`, `.font-display` e `.font-mono`.
- Dashboard reformulado como painel de gestao: metricas, busca, lista de bio sites, copiar link, copiar chave, QR, editar, abrir, pausar/publicar, duplicar e excluir.
- QR Code separado em tela propria com titulo, subtitulo, selecao de bio site, previa de plaquinha, copiar link, abrir bio site e download SVG do QR.
- `/me` refeito como area do cliente por chave, com validacao via provider local e layout alinhado.
- `/:slug` agora renderiza o bio site publico; `/:slug/pix` continua dedicado ao Pix Hub.
- Catalogo aceita `category-carousel`, mantendo compatibilidade com `grouped`.
- Bio site publico preservado visualmente, com refinamentos em textos, Wi-Fi, Pix, catalogo e fallback de rota publica.
- Criada camada `dataProvider` para isolar `localStorage` e facilitar troca futura para Supabase.

## Duplicacoes removidas ou reduzidas

- Operacoes de listar, salvar, criar, duplicar, publicar, pausar e validar chave foram centralizadas em `src/lib/dataProvider.ts`.
- Helpers separados para slug, Pix, Wi-Fi e QR foram criados como ponto de entrada futuro.

## Rotas testadas

- `npm run build` passou.
- Rotas geradas pelo build: `/`, `/app`, `/app/novo`, `/app/qr`, `/me`, `/b/[slug]`, `/editar/[slug]`, `/[slug]` e `/[slug]/pix`.

## Pendencias reais

- Revisar visualmente no navegador todos os fluxos longos de edicao, pois localStorage depende de interacao manual.
- Evoluir `dataProvider` para Supabase quando as credenciais e regras de RLS estiverem prontas.
- Finalizar upload real de imagens com Storage.
- Melhorar exclusao de mocks fixos com tombstone local, caso seja necessario esconder templates mockados no painel.
