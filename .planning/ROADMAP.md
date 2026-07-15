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
- [ ] **Phase 2: Revenue Share — Agência** - Agência vira gratuita + comissão 30/70, mecanismo de pagamento com split, definição do que conta como venda
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

### Phase 2: Revenue Share — Agência
**Goal**: Agência vira acesso gratuito à plataforma white-label, com 30% de comissão pro Toqy sobre cada venda do revendedor (70% fica com ele), com um mecanismo real de cobrar essa comissão (não só combinado de boca).
**Depends on**: Phase 1 (mesma revisão de contrato/cobrança)
**Requirements**: PLAN-06, PLAN-07, PLAN-08, PLAN-09
**Success Criteria**:
  1. Está definido e documentado o mecanismo técnico de split de pagamento (Kiwify coprodução, gateway com split, ou reporte manual — com trade-offs explícitos de cada um)
  2. Está definido precisamente o que conta como "uma venda" pra fins de comissão
  3. Quem já comprou Agência como pagamento único tem um caminho claro (migra ou fica grandfathered)
  4. O revendedor consegue ver, no próprio painel, quanto vendeu e quanto deve/já foi descontado de comissão
**Plans**: TBD

### Phase 3: Landing Page
**Goal**: A landing page para de vender "planos de bio site" e passa a vender "nível de negócio que você consegue rodar", com os planos, preços e modelo de comissão da Agência já corretos (pós Phase 1 e 2).
**Depends on**: Phase 1, Phase 2
**Requirements**: SITE-01, SITE-02
**Success Criteria**:
  1. Cada card de plano comunica claramente o que a pessoa CONSEGUE FAZER/VENDER com ele, não só a lista de features técnicas
  2. Existe uma seção explícita sobre ganhar dinheiro com o Toqy (renda extra, revenda)
  3. O card da Agência comunica corretamente o modelo gratuito + comissão (não "R$149,90")
**Plans**: TBD

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
**Goal**: O editor de bio site que já existe fica "muito melhor", com uma lista concreta (função por função) do que falta ou pode melhorar.
**Depends on**: Nothing técnico, mas faz mais sentido depois do reposicionamento (Phase 3) pra saber o que realmente importa pro público novo
**Requirements**: BIO-01
**Success Criteria**:
  1. Existe uma auditoria completa (não uma lista solta) do editor atual, função por função
  2. Cada item da auditoria tem uma decisão: melhora agora, melhora depois, ou não vale a pena
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

## Progress

**Execution Order:**
Fases 1 e 2 primeiro (fundação de dinheiro), depois 3 (landing), depois 4-8 podem
ser reordenadas conforme prioridade do Leonardo (não têm dependência forte entre
si, só dependem de 1), 9 por último.

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 1. Planos e Preços | 1/1 | Complete | 2026-07-15 |
| 2. Revenue Share — Agência | 0/TBD | Not started | - |
| 3. Landing Page | 0/TBD | Not started | - |
| 4. Google Meu Negócio | 0/TBD | Not started | - |
| 5. Cardápio Digital | 0/TBD | Not started | - |
| 6. Bio Site | 0/TBD | Not started | - |
| 7. QR Codes | 0/TBD | Not started | - |
| 8. Geração de arte | 0/TBD | Not started | - |
| 9. Conteúdo | 0/TBD | Not started | - |

---
*Roadmap criado: 2026-07-16*
