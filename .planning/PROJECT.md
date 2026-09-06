# ToqyApp — Fase "SaaS de Verdade" (pós-pivô 2026-07-16)

> Nota sobre GSD: o Leonardo pediu pra ativar o skill `/gsd:new-project` (usado
> antes no ZapFlow, ver `RULE-GSD-MANDATORY` do Mega Brain). Esse skill não está
> carregado nesta sessão (`Skill: gsd:new-project` retornou "Unknown skill") —
> este documento e o `ROADMAP.md` seguem manualmente a MESMA estrutura/rigor que
> o GSD produziria (fases numeradas, requirements rastreáveis, success criteria
> por fase), espelhando o padrão já usado em `ZapFlow/.planning/`. Se o skill
> for instalado numa sessão futura, `/gsd:new-project` pode reimportar/validar
> este trabalho no formato nativo dele.

## What This Is

Ver `.planning/VISION.md` pro histórico completo da decisão. Resumo: o Toqy
deixa de ser vendido como "ferramenta de bio site" e passa a ser vendido como
**a caixa de ferramentas completa + o modelo de negócio pra quem quer vender
presença digital pro comércio local** (bio site, Pix, Wi-Fi, QR, NFC, avaliação
Google, cardápio digital, plaquinha física com arte por IA) — com conteúdo
educacional (blog, ebooks) atraindo quem busca renda extra/negócio, não só quem
já decidiu que quer um bio site.

## Core Value

Cada plano pago deixa de ser "X bio sites por Y reais" e passa a ser "o nível de
negócio que você consegue rodar" — do teste grátis até rodar como agência com
marca própria. Todos os planos pagos são assinatura mensal (decisão confirmada
2026-07-16, ver VISION.md seção E).

## Requirements

### Validated (já existe e funciona)

- ✓ Bio site com editor visual, preview ao vivo — existing
- ✓ Catálogo flexível (carrossel/grid/categorias/lista) — existing, serve de base pro reposicionamento "Cardápio Digital"
- ✓ Pix real (BR Code EMV), Wi-Fi QR, QR Code personalizado editável (Essencial/Agência) — existing
- ✓ Gerador de arte com IA pra plaquinha (gpt-image-2), exclusivo Essencial/Agência — existing
- ✓ Programa de indicação (+3 bio sites por conversão paga) — existing
- ✓ Analytics básico (visualizações por bio site) — existing
- ~~White-label mínimo (remove selo "Criado com TOQY")~~ — **removido do produto em 2026-09-01** (decisão do Leonardo): nenhum plano promete mais esconder o selo "Criado com TOQY", ele é fixo em todo bio site (ver PublicBioSite.tsx). Substituído pela Fase 10 do roadmap: "domínio próprio" (Agência) construído de verdade via API da Vercel.

### Active (escopo deste pivô — QUAIS requisitos, ainda sem fase/prioridade atribuída)

<!-- IDs no padrão XXX-NN pra rastreabilidade entre PROJECT.md e ROADMAP.md,
     mesmo padrão usado no ZapFlow. Preenchido nesta sessão a partir do pedido
     "detalhe por detalhe, função por função, botão por botão" — cada fase do
     ROADMAP.md vai aprofundar o subconjunto relevante quando for planejada. -->

**PLAN — Planos, preços e cobrança** (Fase 1, completa 2026-07-15)
- [x] PLAN-01: Freelancer migra de pagamento único pra assinatura mensal (Essencial já é mensal)
- [x] PLAN-02: Novo preço mensal justo pro Freelancer (hoje R$59,90 único — não dá pra copiar o número direto pro mensal)
- [x] PLAN-03: Migração de quem já comprou pagamento único (Freelancer OU Agência) — acesso vitalício preservado, sem virar cobrança nova
- [x] PLAN-04: Novos produtos recorrentes na Kiwify pro Freelancer + `resolvePlan()` do webhook atualizado
- [x] PLAN-05: `contrato-assinatura/page.tsx` reescrito pra refletir a nova estrutura (Essencial + Freelancer mensal, Agência revenue-share — ver PLAN-06 a 09)
(Fase 2, completa 2026-07-15)
- [x] PLAN-06: ~~Agência vira GRATUITA + 30% de comissão pro Toqy~~ — **desenho abandonado no mesmo dia** (2026-07-15, ver `ROADMAP.md` Phase 2): permitia qualquer assinante virar Agência de graça sem nunca revender nada. Desenho final: Agência continua assinatura paga (R$99,90/mês); quem já paga Freelancer/Agência ganha link de indicação (comissão 20%/30% pro indicador, desconto 10%/15% pro indicado, via Kiwify Afiliados)
- [x] PLAN-07: Mecanismo de pagamento definido: cupom Kiwify (`?coupon=CODIGO`, aplicado em `resellerTiers.applyCoupon()`) pro desconto do indicado + comissão de afiliado ajustada via API Kiwify (`PUT /affiliates/{id}`, `setKiwifyAffiliateCommission()` em `kiwifyApi.ts`) — não existe endpoint de CRIAR afiliado, o indicador se candidata 1x no link público (aprovação automática configurada por Leonardo)
- [x] PLAN-08: "Uma venda" = qualquer plano pago que o indicado comprar, rastreado por `kiwify_order_id` único em `toqy_commission_ledger`
- [x] PLAN-09: Quem já comprou Agência como pagamento único fica grandfathered (`legacy_lifetime_access`), fora do modelo de comissão

**GMB — Sistema de avaliação Google (Google Meu Negócio)**
- [ ] GMB-01: Modo "Avaliação Google" dedicado em `/app/qr` (hoje só dá pra fazer via "Link personalizado" manual)
- [ ] GMB-02: (a definir na fase) — o que mais um "consultor de presença digital" precisa pra vender isso como serviço: onboarding assistido, script pronto, algo no bio site?

**CARD — Cardápio digital**
- [ ] CARD-01: Reposicionar/nomear "Catálogo" explicitamente como "Cardápio Digital" nos materiais
- [ ] CARD-02: (a definir na fase) — melhorias específicas de cardápio (preço por item já existe? categorias tipo "Entradas/Pratos/Bebidas"? observações do prato?)

**BIO — Melhorias no bio site**
- [ ] BIO-01: (a definir na fase) — auditoria do editor atual pra listar o que falta pra ficar "muito melhor", função por função
- [x] MOB-01: Fluxo de criação (onboarding + SiteBuilder) auditado — pedido explícito 2026-09-05: "maioria dos clientes cria pelo celular... tem que ser muito fácil de criar pelo celular, igual Linktree". **Achado principal, corrigido**: em ambos (onboarding 7 etapas + editor SiteBuilder 7 etapas), o rodapé Voltar/Continuar não era fixo — em etapas longas (Negócio, Serviços, Links e Botões, Catálogo) o usuário tinha que rolar até o fim da tela pra achar o botão, toda vez. Corrigido: rodapé agora fixo embaixo da tela no celular (`fixed inset-x-0 bottom-0`, com `env(safe-area-inset-bottom)` pro iPhone), volta ao normal a partir de `sm`. Botão flutuante de preview do SiteBuilder reposicionado pra não ficar coberto pelo novo rodapé fixo. **Já estava bom, sem necessidade de mexer**: reorder de botões/catálogo por drag já suporta toque de verdade (`DragReorderList.tsx`, `TouchSensor` com delay anti-conflito de scroll, mais setas ↑↓ como alternativa), cropper de imagem (`ImageCropper.tsx`, via `react-easy-crop`) já suporta pinça/arrastar por toque nativamente, preview mobile via botão flutuante + modal fullscreen já existia. **Não verificado ao vivo**: o ambiente de dev local usa Supabase placeholder (sem rede) e a ferramenta de navegador teve instabilidade real pra passar da tela de login sem uma sessão real — mudança aplicada por análise de código + Tailwind (mesmo padrão já usado e visualmente confirmado em `CookieConsent.tsx`), não por screenshot ao vivo do fluxo logado. Recomendado: Leonardo confirmar visualmente no celular real na próxima janela de teste.
- [x] ICO-01: Pesquisado e adicionado ícones oficiais (path SVG real, baixado do CDN da Simple Icons, cores reais da marca) — não inventados. Além dos já existentes (WhatsApp/Instagram/Facebook badges próprios; TikTok/LinkedIn/YouTube/Telegram/Spotify com cor de marca real), adicionados nesta sessão (2026-09-05): **X (Twitter), Pinterest, Threads** (alcance social geral) e, com prioridade pro público real do Toqy (comércio local brasileiro) — **iFood** (essencial pra restaurante/lanchonete/delivery), **Waze** (alternativa ao Google Maps, muito usado no Brasil pra "como chegar"), **PicPay** e **Mercado Pago** (pagamento, ao lado do Pix), **Behance** (portfólio pro segmento fotógrafo). **Kwai** pesquisado mas não existe na biblioteca Simple Icons — não fabricado (ver AGENT-INTEGRITY-PROTOCOL: zero invenção), deixado de fora até achar uma fonte oficial confiável.
- [x] LNK-01: Estudo a fundo do Linktree feito, ver `.planning/LINKTREE-STUDY.md`. Achado no megabrain (checado antes de pesquisar, como pedido): já existia diretriz aprovada "TOQY não deve parecer Linktree brasileiro, ser premium" (`agents/sua-empresa/products/TOQY.md`), mas nenhum estudo funcional — feito agora. Conclusão: Toqy já resolve melhor as dores reais do comércio local BR (Pix nativo > loja genérica, catálogo rico > vitrine simples); a única coisa do Linktree que realmente valia trazer é a facilidade de criação pelo celular em poucos minutos, já endereçada pelo MOB-01. Nenhuma mudança de posicionamento/visual recomendada.
- [~] DES-01: Auditoria de design "clean e bonito" — objetivo declarado: "TEMOS QUE SER O MELHOR DO BRASIL". **Home (`/`) feita em 2026-09-06**: pesquisa real de 4 concorrentes (Linktree, GreatPages, Keepo, MyPostFlow — lnk.bio/linkme.bio bloquearam o fetch), removidos os 9 prints de tela soltos no meio da página, copy "plaquinha" trocada por "link da bio do Instagram" na seção Recursos, seção "Faça as contas + Usos" (sem coesão) removida, FAQ virou página própria (`/faq`), cards de exemplo aumentados (190→240px). Dashboard/editor/páginas legais ainda não auditados.
- [ ] CARD-03: Vídeo e post de Instagram embutidos no catálogo — **bloqueado em feedback real de clientes primeiro** (pedido explícito: "temos que pegar feedbacks de clientes sobre o catálogo" antes de construir)

**QR — QR Codes**
- [ ] QR-01: (a definir na fase) — auditoria completa dos modos existentes (bio site/Pix/link/futuro avaliação Google)

**ART — Geração de arte pra plaquinhas**
- [ ] ART-01: (a definir na fase) — auditoria pós-troca pra gpt-image-2, qualidade validada pelo Leonardo?

**DOM — Domínio próprio (Agência)** (Fase 10, código completo 2026-09-05)
- [x] DOM-01: Cliente Agência conecta um domínio próprio a um bio site específico, de verdade (API da Vercel, não só uma promessa na landing) — migration já aplicada em produção (2026-09-05); falta só criar o token na Vercel (`VERCEL_API_TOKEN`/`VERCEL_PROJECT_ID`) antes de funcionar de ponta a ponta, ver ROADMAP.md Phase 10

**SITE — Landing page** (Fase 3, completa 2026-07-17)
- [x] SITE-01: Reposicionar em torno de "plano de negócio", não "plano de bio site"
- [x] SITE-02: Nova seção "Ganhe dinheiro com o Toqy" (ou similar)

**ANL — Analytics / retenção**
- [ ] ANL-01: Relatório mensal de cliques automático, enviado por e-mail pro cliente final de um revendedor (ex: "seu bio site teve X cliques em WhatsApp, Y no Pix este mês") — sugestão de usuário real capturada em 2026-09-05: "seria legal poder gerar um relatório mensal de cliques para os clientes, tipo um plus pra segurar os clientes na recorrência". Dados já existem (`toqy_analytics_events`), falta o job de envio + template de e-mail. Não iniciado.

**CONT — Conteúdo (blog, ebooks, diretório)**
- [ ] CONT-01: Primeiro ebook isca + página de captura
- [ ] CONT-02: Blog com títulos específicos (SEO pro público "quero renda extra", não "quero bio site")
- [ ] CONT-03: Diretório "Consultor Certificado TOQY"

**Decisão de produto — Gerador de arte com IA descontinuado dos planos (2026-09-06)**: removido de Essencial/Freelancer/Agência (features, copy, menu do painel). Motivo do Leonardo: "no começo o Toqy foi criado por causa das plaquinhas que eu estava fazendo, mas hoje quero ser concorrente do Linktree — a pessoa não vai vender plaquinha, vai vender bio site". A plaquinha física vira um sistema separado, a decidir depois — código de `/app/artes` e `/api/plaque-designs/generate` mantido (não deletado), só desacoplado da oferta atual.

**Novo — Blocos reordenáveis + figurinhas livres + música própria (2026-09-06)**: `bodyBlockOrder` em `types.ts` deixa botões/catálogo/música/Instagram na ordem que o dono do bio site quiser (drag no editor). Figurinhas ganharam posição livre x/y arrastável no preview (banco próprio de emojis/formas, sem risco de direito autoral). Música agora é upload de verdade (hospedado no Supabase Storage do Toqy, limite ~60s/~4MB pelo teto real da Vercel). Registrado como não feito nesta rodada (fica pra próxima, ver ADIC-01 abaixo): posição x/y livre pra catálogo/botões (decisão técnica: quebraria em telas diferentes — só blocos reordenáveis, como Linktree/Beacons fazem), intercalar item a item dentro de um bloco, e melhorias específicas de catálogo (galeria de fotos por item, vídeo, selo de esgotado, "clica num item abre outro").

- [ ] ADIC-01: Autonomia de layout, próxima etapa — editor de blocos mais profundo (cada item de catálogo/botão vira entidade própria, intercalável um a um) + melhorias de catálogo (galeria de fotos, vídeo, selo de esgotado, detalhe expandido tipo vitrine). Não iniciado.

### Out of Scope (por enquanto)

- Reescrever o motor de bio site do zero — evolução, não substituição
- App mobile nativo
- Multi-idioma (produto é 100% português/mercado brasileiro)

## Context

- Produto já tem uso real (não é greenfield) — qualquer mudança de plano/preço
  precisa considerar quem já é cliente hoje (grandfathering, ver PLAN-03)
- `.planning/VISION.md` tem a pesquisa de mercado completa (GoHighLevel,
  Vendasta, nicho "Consultor Google Meu Negócio") — ler antes de planejar
  qualquer fase, é o embasamento de cada decisão de produto aqui

## Constraints

- Cliente que já pagou pagamento único NUNCA pode ser cobrado de novo sem
  consentimento explícito
- Toda mudança de gating de feature por plano precisa ser reversível/auditável
  (mesmo padrão já usado: `hasCustomQr`, `PLAN_AI_ART_CREDITS`, etc. em
  `subscriptions.ts`/`planLimits.ts` como fonte única de verdade)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Todos os planos pagos viram assinatura mensal | Padrão universal nas plataformas de referência pesquisadas (GoHighLevel, Vendasta) — nenhuma vende pagamento único como produto principal | Confirmado 2026-07-16 |
| GSD skill não usado (não instalado nesta sessão) — estrutura replicada manualmente | `Skill: gsd:new-project` retornou erro | Confirmado 2026-07-16 |
| Planejamento fase por fase (não tudo de uma vez) | Pedido é "detalhe por detalhe, função por função" — profundidade real exige uma fase de cada vez, mesmo princípio do GSD (`/gsd:plan-phase N`) | Pending — aguardando Leonardo escolher a fase 1 |

---
*Criado: 2026-07-16*
