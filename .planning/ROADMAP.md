# Roadmap: ToqyApp — Pivô "SaaS de Verdade" (2026-07-16)

## Overview

9 fases, do mais fundacional (como o dinheiro entra) pro mais específico
(subsistema por caso de uso, depois conteúdo). Pricing/revenue-share vêm
primeiro porque tudo depois — copy da landing, gating de feature, o que cada
plano promete — depende da estrutura de planos estar fechada. Cada fase é
planejada em detalhe (função por função, botão por botão) só quando chega a
vez dela, não todas de uma vez — mesmo princípio do GSD (`/gsd:plan-phase N`).

## Phases

- [x] **Phase 1: Planos e Preços — recorrência total** - Freelancer migra pra assinatura mensal, novo preço, migração de quem já comprou, produtos Kiwify novos
- [x] **Phase 2: Programa de Indicação com Comissão** - Freelancer/Agência ganham link de indicação (desconto pro indicado, comissão + bônus de bio site pro indicador via Kiwify Afiliados)
- [ ] **Phase 3: Landing Page** - Reposicionamento completo em torno de "plano de negócio", nova seção de renda, cards de plano refletindo a nova estrutura
- [ ] **Phase 4: Subsistema Google Meu Negócio** - Modo QR de avaliação dedicado + o que mais falta pra vender isso como serviço
- [ ] **Phase 5: Subsistema Cardápio Digital** - Reposicionar catálogo existente + melhorias específicas de cardápio
- [ ] **Phase 6: Bio Site — auditoria e melhorias** - Função por função do editor atual, o que falta pra ficar "muito melhor"
- [ ] **Phase 7: QR Codes — auditoria completa** - Todos os modos existentes + novo modo de avaliação Google
- [ ] **Phase 8: Geração de arte pra plaquinhas — auditoria** - Qualidade pós-troca pra gpt-image-2, o que falta
- [ ] **Phase 9: Conteúdo** - Primeiro ebook isca, blog, diretório de Consultor Certificado

## Phase Details

### Phase 1: Planos e Preços — recorrência total
**Goal**: Freelancer deixa de ser pagamento único e vira assinatura mensal, com preço justo recalculado, sem quebrar quem já comprou.
**Depends on**: Nothing (fundação)
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05
**Success Criteria** (o que precisa ser verdade):
  1. Freelancer tem um preço mensal definido e justificado (não é só dividir o preço único por um número arbitrário de meses)
  2. Quem já comprou Freelancer/Agência como pagamento único continua com acesso total, sem cobrança nova, marcado de forma identificável no banco
  3. Existe um produto recorrente novo na Kiwify pro Freelancer, reconhecido pelo webhook
  4. `contrato-assinatura/page.tsx` reflete a estrutura real (sem mencionar "pagamento único" pro Freelancer)
**Plans**: TBD

### Phase 2: Programa de Indicação com Comissão (Freelancer + Agência)
**Goal**: ~~Agência vira acesso gratuito à plataforma white-label, com 30% de comissão pro Toqy sobre cada venda do revendedor~~ — **desenho abandonado no mesmo dia** (2026-07-15): permitia qualquer assinante Essencial/Freelancer virar Agência de graça (100 bio sites, todos os recursos) sem nunca revender nada, cancelando a recorrência da Fase 1. Substituído por: Agência volta a ser assinatura paga (R$99,90/mês); quem JÁ assina Freelancer ou Agência ganha um link de indicação — indicado recebe desconto (10%/15%) em qualquer plano, indicador recebe comissão (20%/30%, via Kiwify Afiliados) + bio sites de bônus (+1/+2) por venda confirmada.
**Depends on**: Phase 1 (mesma revisão de contrato/cobrança)
**Requirements**: PLAN-06 a PLAN-09 (redefinidos pra refletir o novo desenho — não são mais sobre "Agência grátis")
**Success Criteria**:
  1. ✓ Mecanismo técnico: cupom Kiwify (`?coupon=CODIGO`) pro desconto do indicado; comissão por afiliado ajustada via API (`PUT /affiliates/{id}`) — confirmado que a Kiwify não tem endpoint de CRIAR afiliado, só listar/editar (docs.kiwify.com.br/api-reference/affiliates), então o indicador precisa se candidatar 1 vez no link público de afiliados do produto (aprovação automática configurada por Leonardo, sem trabalho manual por pessoa).
  2. ✓ "Uma venda" = qualquer plano pago que o indicado comprar, rastreado por `kiwify_order_id` único no ledger.
  3. ✓ Quem já comprou Agência pagamento único: continua grandfathered (`legacy_lifetime_access`).
  4. ✓ Indicador vê comissão/indicados/bônus no próprio painel (`/app/revenda`, auto-visível pra Freelancer/Agência, sem ação de "virar revendedor").
**Plans**:
  - ✓ Sub-estágio A (backend, commit `6e42618`, 2026-07-15): schema (`toqy_resellers`/`toqy_managed_clients`/`toqy_commission_ledger` + RLS), webhook grava comissão, trigger de signup vincula cliente↔indicador
  - ✓ Sub-estágio B v1 (Agência grátis + revenda 30/70) — **revertido no mesmo dia**, ver Goal acima
  - ✓ Sub-estágio B v2 (desenho final, mesmo dia): `src/lib/resellerTiers.ts` (config única dos tiers), `POST /api/resellers/ensure` (auto-provisiona código pra quem já é Freelancer/Agência, sem upgrade), `POST /api/resellers/sync-affiliate` (ajusta comissão via API Kiwify), `POST /api/resellers/my-coupon` (desconto do indicado), bônus de bio site tiered no webhook (soma em `referral_bonus_biosites`, não sobrescreve `biosites_limit`), `/app/revenda` reescrito, landing/contrato-assinatura com Agência paga de novo
  - ✓ Links reais confirmados 2026-07-16 (nota anterior dizia "placeholder" — desatualizada): `KIWIFY_LINKS.agency` = `pay.kiwify.com.br/DHPZf2c`, overage bio site = `pay.kiwify.com.br/KOreqg7` (R$5,99 — Kiwify não vende abaixo de R$5,99, por isso não é R$2,99), overage crédito de arte = `pay.kiwify.com.br/LsDkNHu` (R$8,99), link de afiliado Freelancer = `dashboard.kiwify.com/join/affiliate/s6bt0Cf9`, link de afiliado Agência = `dashboard.kiwify.com/join/affiliate/QhN8g8jN` — todos já em `resellerTiers.ts`/`subscriptions.ts`
  - Pendente (manual, fora de código, só o Leonardo consegue confirmar no painel da Kiwify): (a) cupons `REVENDA10`/`REVENDA15` criados de verdade nos produtos pagos; (b) aprovação automática de afiliados habilitada nos produtos; (c) `setKiwifyAffiliateCommission()` em `kiwifyApi.ts` nunca foi testado contra a API real — formato exato do campo `commission` (percentual×100 vs outro) não confirmado, testar antes de confiar

### Phase 3: Landing Page
**Goal**: A landing page para de vender "planos de bio site" e passa a vender "nível de negócio que você consegue rodar", com os planos, preços e modelo de comissão da Agência já corretos (pós Phase 1 e 2).
**Depends on**: Phase 1, Phase 2
**Requirements**: SITE-01, SITE-02
**Success Criteria**:
  1. Cada card de plano comunica claramente o que a pessoa CONSEGUE FAZER/VENDER com ele, não só a lista de features técnicas
  2. Existe uma seção explícita sobre ganhar dinheiro com o Toqy (renda extra, revenda)
  3. ~~O card da Agência comunica corretamente o modelo gratuito + comissão (não "R$149,90")~~ — **critério desatualizado, corrigido 2026-07-17**: descrevia o desenho v1 "Agência grátis + revenda 30/70", revertido no mesmo dia em que foi criado (2026-07-15, ver Phase 2 acima) por ter um furo real. A Agência hoje é assinatura paga (R$99,90/mês) DE PROPÓSITO — o card já comunica isso corretamente. Critério substituído por: o card da Agência (e do Freelancer) comunica corretamente o benefício de indicação (comissão %) como um EXTRA de quem já paga, não como a razão de ser do plano.
**Plans**: Sub-estágio A (copy dos cards + seção "Ganhe dinheiro com o Toqy", 2026-07-17)

### Phase 4: Subsistema Google Meu Negócio
**Goal**: Alguém consegue vender "melhorar a avaliação no Google" como serviço usando ferramentas do Toqy de ponta a ponta, não só um QR genérico.
**Depends on**: Phase 1
**Requirements**: GMB-01, GMB-02
**Success Criteria**:
  1. Existe um modo "Avaliação Google" dedicado em `/app/qr` (não precisa mais usar "Link personalizado" manualmente)
  2. Está definido o que mais falta (script de abordagem? onboarding assistido? algo no bio site?) — a definir na hora de planejar esta fase
**Plans**: TBD

### Phase 5: Subsistema Cardápio Digital
**Goal**: Alguém consegue vender "cardápio digital" como serviço específico pra restaurante/bar, não um catálogo genérico reaproveitado.
**Depends on**: Phase 1
**Requirements**: CARD-01, CARD-02
**Success Criteria**:
  1. "Cardápio Digital" existe como nome/posicionamento explícito nos materiais
  2. Levantado o que falta tecnicamente pra ficar bom de verdade pra esse caso de uso específico (preço por item, categorias, observação de prato, disponibilidade) — a definir na hora de planejar esta fase
**Plans**: TBD

### Phase 6: Bio Site — auditoria e melhorias
**Goal**: O editor de bio site que já existe fica "muito melhor", com uma lista concreta (função por função) do que falta ou pode melhorar — com foco explícito em CRIAÇÃO PELO CELULAR (pedido do Leonardo, 2026-09-05: maioria dos clientes cria pelo celular, o fluxo tem que ser tão fácil quanto o Linktree) e num visual "melhor do Brasil" em todo o site (landing + dashboard + editor), seguindo as skills `premium-design-standards`/`frontend-design`/`grill-me`.
**Depends on**: Nothing técnico, mas faz mais sentido depois do reposicionamento (Phase 3) pra saber o que realmente importa pro público novo
**Requirements**: BIO-01, MOB-01, ICO-01, LNK-01, DES-01, CARD-03
**Success Criteria**:
  1. Existe uma auditoria completa (não uma lista solta) do editor atual, função por função
  2. Cada item da auditoria tem uma decisão: melhora agora, melhora depois, ou não vale a pena
  3. Fluxo de criação (onboarding + SiteBuilder) testado e ajustado especificamente em viewport mobile — sem ficar "encolhido", com toques/gestos fáceis
  4. Ícones oficiais (cores reais) pesquisados/adicionados pros apps mais usados que podem entrar no Toqy, além dos já existentes
  5. Estudo do Linktree documentado (o que ele faz hoje visualmente) com decisões concretas de o que trazer/melhorar no Toqy
  6. Todas as páginas públicas (landing, termos, privacidade, cookies, contrato-assinatura, obrigado/*) auditadas visualmente e alinhadas ao design system
**Plans**: TBD

### Phase 7: QR Codes — auditoria completa
**Goal**: Todos os modos de QR (bio site, Pix, link, avaliação Google) funcionam bem e estão claramente diferenciados por plano.
**Depends on**: Phase 4 (o modo de avaliação Google nasce lá)
**Requirements**: QR-01
**Success Criteria**:
  1. Auditoria função por função de cada modo existente
  2. Gating por plano revisado e consistente com a Phase 1/2
**Plans**: TBD

### Phase 8: Geração de arte pra plaquinhas — auditoria
**Goal**: Confirmar que a troca pra gpt-image-2 realmente resolveu o problema de qualidade que motivou a troca, e listar o que mais falta.
**Depends on**: Nothing (só depende do Leonardo conseguir testar de verdade, hoje travado no billing da OpenAI)
**Requirements**: ART-01
**Success Criteria**:
  1. Pelo menos algumas gerações reais testadas e avaliadas pelo Leonardo
  2. Lista de ajustes de prompt/qualidade, se necessário
**Plans**: TBD

### Phase 9: Conteúdo
**Goal**: Existe pelo menos um ebook isca publicado + estrutura de blog + o diretório de "Consultor Certificado" no ar.
**Depends on**: Phase 3 (landing precisa já comunicar o posicionamento novo antes do conteúdo apontar pra ela)
**Requirements**: CONT-01, CONT-02, CONT-03
**Success Criteria**:
  1. Primeiro ebook publicado com página de captura
  2. Estrutura de blog existe (mesmo que com poucos posts iniciais)
  3. Diretório de Consultor Certificado no ar, mesmo que com critério simples
**Plans**: TBD

### Phase 10: Domínio próprio (Agência) — feito de verdade
**Goal**: "Domínio próprio" deixa de ser uma linha na tabela de comparação sem nada por trás e vira uma feature que funciona: cliente Agência conecta um domínio dele (ex: meunegocio.com.br) a um bio site específico.
**Depends on**: Nothing técnico — achado 2026-09-05 durante a auditoria geral: a feature era 100% prometida (landing, /obrigado/agencia, subscriptions.ts) e 0% implementada (mesma categoria de problema que o white label tinha, removido em 2026-09-01).
**Requirements**: DOM-01
**Success Criteria**:
  1. Cliente Agência escolhe um bio site e cadastra um domínio próprio no painel (`/app/dominio`)
  2. O domínio é adicionado ao projeto na Vercel via API (`src/lib/vercelDomains.ts`) e o app mostra o CNAME que falta configurar
  3. Assim que o CNAME propaga, o domínio serve o bio site de verdade (`src/middleware.ts` reescreve pra `src/app/custom-domain/page.tsx`, que resolve por Host header)
  4. Reversível: botão de remover domínio tira ele do projeto na Vercel e do banco
**Plans**: ✓ Código completo (migration `2026-09-05_custom_domains.sql`, `src/lib/vercelDomains.ts`, `src/app/api/domains/route.ts`, `src/middleware.ts`, `src/app/custom-domain/page.tsx`, `src/app/app/dominio/page.tsx`). ✓ Migration aplicada em produção (`leonardo-ecossistema`, 2026-09-05, colunas `custom_domain`/`custom_domain_status` confirmadas em `toqy_biosites`). **Pendente 1 passo manual do Leonardo**: criar um token na Vercel (conta que hospeda o toqyapp de verdade) e preencher `VERCEL_API_TOKEN`/`VERCEL_PROJECT_ID` nas env vars do projeto (ver `.env.example`) — sem isso a rota responde erro 502 amigável, não quebra o resto do app.

### Phase 11: Segmentação de público (Pro Pessoal + landing dedicada)
**Goal**: O toqy.com.br deixa de vender "planos de bio site" genéricos e passa a segmentar por público desde a primeira tela — "pro meu negócio" vs "pra vender" — cada um com sua página, seus planos e seu preço certo. Novo plano de entrada (Pro Pessoal, R$9,90/mês) fecha o buraco entre o Gratuito e o Essencial (que sempre foi pensado pra quem revende, não pra uso pessoal).
**Depends on**: Phase 10 (domínio próprio) — o Pro Pessoal usa o mesmo sistema de add-on avulso
**Requirements**: (novo, sem IDs formais — pedido direto do Leonardo, 2026-09-05)
**Success Criteria**:
  1. ✓ Plano "Pro" novo em `subscriptions.ts` (R$9,90/mês, 1 site, Pix/Wi-Fi/Catálogo/QR, sem arte/revenda)
  2. ✓ Domínio próprio do Pro Pessoal é add-on avulso anual (R$59,90 sugerido), não recorrente
  3. ✓ Figurinhas, música e preview de Instagram ao vivo — liberado Pro Pessoal + revenda, fora do Gratuito
  4. ✓ Hero da landing com espaço de vídeo + 2 CTAs indo pra páginas dedicadas
  5. ✓ `/para-mim` (Gratuito/Pro) e `/para-vender` (Essencial/Freelancer/Agência) no ar, cada uma com sua copy
**Plans**: ✓ Código completo, ✓ produtos criados na Kiwify e links reais já ligados em `subscriptions.ts` (`KIWIFY_LINKS.pro`, `OVERAGE_LINKS.customDomain`), ✓ e-mail de confirmação + página de obrigado próprias pros 2 (`/obrigado/pro`, `/obrigado/dominio-proprio`). Fase 6 (login) do plano original desta sessão foi avaliada e não precisou de mudança — Google OAuth já funciona no código, só falta o Leonardo confirmar Client ID/Secret no painel do Supabase (não verificável via código/MCP).

### Phase 12: Parity de app (inspirado no app do Linktree) — itens grandes fora desta rodada
**Goal**: registrar os itens do app oficial do Linktree (vídeo gravado pelo Leonardo, analisado frame a frame em 2026-09-06) que são sistemas grandes de verdade, não ajuste de UX — cada um exige uma decisão de arquitetura/integração própria antes de virar código, então ficaram fora da rodada de redesign minimalista + fixes de UX (essa outra rodada: paleta recalibrada, tab bar mobile, checklist de configuração com %, compartilhar com QR no editor, Instagram virou slide de verdade com paginação e tamanho por post — tudo já entregue em 2026-09-06).
**Depends on**: Nothing técnico — são independentes entre si, cada um pode ser priorizado isoladamente quando o Leonardo quiser.
**Requirements**: (novo, sem IDs formais — mapeado do vídeo, decisão de escopo confirmada com o Leonardo via pergunta direta: "só o essencial de UX agora")
**Itens mapeados do vídeo** (ver frames em `C:\Users\Leonardo\AppData\Local\Temp\claude\toqy_video_frames\sheet_0{1..4}.jpg`, não versionados no repo):
  1. **Loja/marketplace** (aba "Ganhar" → Produtos/Pedidos do Linktree) — precisa de modelo de pagamento/inventário próprio, é um sistema de e-commerce de verdade, não uma tela.
  2. **Resposta automática de Instagram via DM** ("Responda enquanto você dorme") — exige app registrado + OAuth com a Meta Graph API, mesma decisão já tomada antes nesta sessão pro preview de Instagram (feature real, mas trabalho de integração de plataforma externa, não só UI).
  3. **Planejador de redes sociais** — agendamento de posts, também depende de API de terceiros (Meta/outras redes).
  4. **Selo de verificação** — precisa de um processo de moderação/verificação por trás, não é só um badge visual.
  5. **Captura de e-mail/WhatsApp de visitantes** (aba "Público" do Linktree: "Suas ferramentas de captura de público") — a parte de armazenar e listar contatos é viável rápido; a parte de "campanha de e-mail marketing" que o Linktree também oferece ali é maior.
  6. **Banners de causa** (Anti-Racism, Pride, etc., com toggle e link pra ação) e **coleções sazonais de figurinhas com curadoria** ("Daisy Chain Fields Festival") — o Toqy já tem a base de figurinhas livres (emoji + formas, arrastáveis); virar "coleções com tema/prazo" é decisão de conteúdo contínuo, não só código.
**Success Criteria**: TBD por item, quando o Leonardo priorizar algum
**Plans**: TBD

## Progress

**Execution Order:**
Fases 1 e 2 primeiro (fundação de dinheiro), depois 3 (landing), depois 4-8 podem
ser reordenadas conforme prioridade do Leonardo (não têm dependência forte entre
si, só dependem de 1), 9 por último.

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 1. Planos e Preços | 1/1 | Complete | 2026-07-15 |
| 2. Programa de Indicação | 3/3 (A, B v1 revertido, B v2) | Complete* | 2026-07-15 |
| 3. Landing Page | 1/1 | Complete | 2026-07-17 |
| 4. Google Meu Negócio | 0/TBD | Not started | - |
| 5. Cardápio Digital | 0/TBD | Not started | - |
| 6. Bio Site | 0/TBD | Not started | - |
| 7. QR Codes | 0/TBD | Not started | - |
| 8. Geração de arte | 0/TBD | Not started | - |
| 9. Conteúdo | 0/TBD | Not started | - |
| 10. Domínio próprio | 1/1 (código) | Código completo, aguardando setup manual | 2026-09-05 |
| 11. Segmentação de público | 1/1 (código) | Código completo, aguardando 2 produtos Kiwify | 2026-09-05 |
| 12. Parity de app (Linktree) | 0/TBD | Mapeado, não iniciado — itens grandes, priorizar quando quiser | 2026-09-06 |

\* Fase 2: código 100% completo (backend + frontend). Resta 1 passo manual
fora de código, por revendedor: Leonardo cadastra o afiliado na Kiwify e
preenche `kiwify_affiliate_id` — sem isso a comissão daquele revendedor não
é atribuída automaticamente. Ver Phase Details acima.

---
*Roadmap criado: 2026-07-16*
