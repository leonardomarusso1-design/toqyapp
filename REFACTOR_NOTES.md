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
