# Refatoração TOQY — base funcional

## O que foi feito

- Mantida base Next.js atual para facilitar deploy na Vercel.
- Reorganizada a lógica principal em torno de `ToqySite`.
- Corrigidos botões: adicionar, remover, duplicar, mudar tipo, editar campos certos e atualizar preview.
- Separada lógica de URL dos botões em `src/lib/buttonUtils.ts`.
- Sincronização de botões e módulos em `src/lib/buttonSync.ts`.
- Recriados templates por segmento em `src/lib/segmentTemplates.ts`.
- Criados mocks reais: barbearia, pastelaria, assistência técnica, salão, clínica e loja.
- Mantido localStorage como banco temporário em `src/lib/siteStorage.ts`.
- Criado/ajustado editor principal `SiteBuilder` com etapas:
  1. Modelo
  2. Perfil
  3. Visual
  4. Links e Botões
  5. Pix e Wi-Fi
  6. Catálogo
  7. Salvar
- Criado preview ao vivo usando o mesmo `PublicBioSite`.
- Corrigidas rotas:
  - `/`
  - `/app`
  - `/app/novo`
  - `/app/qr`
  - `/me`
  - `/b/:slug`
  - `/editar/:slug`
- Lint e build passam.

## O que ficou preparado para depois

- Supabase
- Upload real de imagens
- Autenticação real
- Planos/assinatura
- Métricas reais
- Painel admin completo

## Testes executados

- `npm run lint` — OK
- `npm run build` — OK

## Ajustes premium 2026-06-14

- Dashboard `/app` separado visualmente da tela de QR Code, agora com cara de painel SaaS: cards de métricas, lista de biosites e ações rápidas.
- `/app/qr` mantido como tela específica de QR Codes, com visual de gestão e cards claros.
- Bio site público refinado com inspiração no modelo premium enviado: ações rápidas no topo, botões translúcidos/glass, social icons, botões longos e destaque/callout.
- PIX redesenhado em modal premium com QR, valores rápidos, copiar chave, recebedor, banco e botão de envio de comprovante via WhatsApp.
- Wi‑Fi redesenhado com QR Code, copiar senha, CTA de check-in/avaliação, Instagram e Facebook.
- Catálogo agora suporta 4 modos: carrossel único, grade 2 colunas, lista vertical e carrosséis por categoria.
- Editor do catálogo ganhou seletor de layout e campo de categoria por item, para casos como “Cortes social”, “Cortes degradê” e outros grupos.
- Templates por segmento foram diferenciados com catálogos, categorias, layouts, imagens placeholders e configurações mais coerentes por nicho.
- Adicionados placeholders SVG em `public/templates/catalog` para deixar os templates menos iguais quando ainda não houver imagens reais.
- Build validado com `npm run build`.
