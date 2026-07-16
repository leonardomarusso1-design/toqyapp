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
- ✓ White-label mínimo (remove selo "Criado com TOQY") — existing

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

**QR — QR Codes**
- [ ] QR-01: (a definir na fase) — auditoria completa dos modos existentes (bio site/Pix/link/futuro avaliação Google)

**ART — Geração de arte pra plaquinhas**
- [ ] ART-01: (a definir na fase) — auditoria pós-troca pra gpt-image-2, qualidade validada pelo Leonardo?

**SITE — Landing page** (Fase 3, completa 2026-07-17)
- [x] SITE-01: Reposicionar em torno de "plano de negócio", não "plano de bio site"
- [x] SITE-02: Nova seção "Ganhe dinheiro com o Toqy" (ou similar)

**CONT — Conteúdo (blog, ebooks, diretório)**
- [ ] CONT-01: Primeiro ebook isca + página de captura
- [ ] CONT-02: Blog com títulos específicos (SEO pro público "quero renda extra", não "quero bio site")
- [ ] CONT-03: Diretório "Consultor Certificado TOQY"

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
