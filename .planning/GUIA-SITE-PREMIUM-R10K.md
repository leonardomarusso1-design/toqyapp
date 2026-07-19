# Guia Completo: Site Premium (R$10k+) e Landing Page de Alta Conversão

> Criado com base no ecossistema Leonardo Marusso, design system "Signal Ledger", knowledge base do Mega Brain e best practices de mercado.
> Arquivos de referência: `projects/toqyapp/.planning/VISION.md`, `docs/design-system-ecossistema-2026-07-03.md`, `knowledge/sources/BASE-CONHECIMENTO-GERAL/SOURCE-BCG008-landing-pages.md`, etc.

---

## 1. Primeiro: O Que Define um Site "Caro" (Premium)?

Um site premium **não é só "bonito"** — é sobre **valor percebido + experiência memorável + resultados mensuráveis**.
Os 5 pilares (do seu ecossistema):
1. **Identidade Visual única e consistente** (não usa templates genéricos)
2. **Copywriting focado em benefícios e resultados, não em features**
3. **UX mobile-first e de alta usabilidade**
4. **Performance lightning-fast (Core Web Vitals) + segurança**
5. **Conversão otimizada (CRO)**

---

## 2. Identidade Visual Premium (Design System "Signal Ledger")

Já temos um design system PRONTO no Mega Brain — use esse! É o que já dá "site de empresário grande" (avaliação do Leonardo).

### 2.1 Tokens de Cor (Não Negociáveis)
| Token | Hex | Onde Usar |
|-------|-----|-----------|
| `bg` | `#F7F5F1` | Fundo da página (papel premium claro, NÃO branco puro!) |
| `card` | `#FFFFFF` | Cards, painéis, inputs |
| `surface` | `#FBFAF7` | Superfície intermediária |
| `border` | `#E7E2D8` | Bordas e divisores |
| `ink` | `#17141A` | Texto principal |
| `muted` | `#6B6560` | Texto secundário |
| `accent` | `#FF4D6D` | CTAs, destaques, ícones-chave (use com MODERAÇÃO!) |
| `violet` | `#8B5CF6` | Gradientes/destaques pontuais, NÃO sozinha |

**Regra das cores**: 60% neutro, 30% secundária, 10% accent (nunca coloque accent em fundo grande!).

### 2.2 Tipografia Premium (Nunca Inter/Space Grotesk Genéricos!)
| Papel | Fonte | Peso |
|-------|-------|------|
| Display (títulos, h1-h5, CTAs) | **Unbounded** | 700-800 (bold/extrabold) |
| Corpo (texto, parágrafos, labels) | **Manrope** | 400-600 |

**Escala tipográfica**: Use razão 1.25 ou 1.333 (consistente).
**Corpo de texto**: Mínimo 16px, line-height 1.5-1.7, largura de linha 45-75 caracteres.

### 2.3 Layout e Composição Premium
- **Grid de 12 colunas**: Padrão web (divisível por 2,3,4,6)
- **Grid de 8pt**: Espaçamentos e tamanhos múltiplos de 8 (ritmo visual consistente)
- **White space é LUXO**: Dobre o espaçamento que parece suficiente entre seções!
- **Cards premium**: Brancos, sombra suave sobre `bg`, borda 1px `border` — profundidade leve, sem sombras pesadas.
- **Micro-animação**: 1 elemento de movimento por página (não polua!). Exemplo: pulso de "sinal" em canvas no hero (círculos concêntricos accent+violet, baixa opacidade).
- **CTA único por seção**: Sem CTA em excesso — foco! O CTA deve ter o MAIOR contraste da página.

---

## 3. Anatomia de uma Landing Page Premium (Que Converte)

Use a estrutura do knowledge base: Hero → prova social rápida → problema → solução → benefícios → features → como funciona → depoimentos → oferta → garantia → FAQ → CTA final.

### 3.1 Above the Fold (O Mais Importante: 5 Segundos para Decidir)
O above the fold DEVE responder:
1. O que é?
2. Para quem?
3. Qual o benefício?
4. O que fazer agora?

**Elementos obrigatórios**:
- **Headline premium**: 1 frase impactante, focado em resultado (ex.: "Crie bio sites profissionais e ganhe até R$10k/mês vendendo presença digital pro comércio local").
- **Subheadline curto**: Expanda o resultado em 1 linha.
- **CTA grande, contrastante**: Texto com benefício (ex.: "Comece a vender" ao invés de "Clique aqui").
- **Visual do produto em uso ou resultado real**: NÃO ilustrações genéricas! Use screenshot do Toqy em funcionamento, ou foto de uma plaquinha física em uso.
- **Prova social rápida**: Logos de clientes ou número pequeno ("1000+ biosites criados").

**Teste obrigatório**: Mostre a dobra por 5 segundos a alguém de fora. Se não souber dizer o que você vende, refaça!

### 3.2 Prova Social (Hierarquia de Força)
1. **Vídeo-depoimento com resultado específico** (mais forte)
2. **Depoimento escrito com foto/nome/contexto** (use formato BAB: antes → mudança → resultado com número)
3. **Print de conversa real** (WhatsApp, etc.)
4. **Logos de clientes**
5. **Números agregados** (ex.: "+1000 biosites criados")

**Regra ética**: NUNCA invente depoimentos (publicidade enganosa, CDC!).

### 3.3 Copywriting Premium: Fale em Benefícios, Não Features
Traduza cada feature com "o que isso significa é que...".
- ❌ Feature: "10 bio sites"
- ✅ Benefício: "Crie até 10 bio sites para seus clientes e gere renda recorrente todo mês"

### 3.4 Garantia (Risco Reverso)
- No Brasil, 7 dias de arrependimento é LEI (CDC art.49).
- Ofereça MAIS para diferenciar: 15, 30 dias, ou garantia de resultado ("Se não conseguir seus primeiros 3 clientes em 30 dias, devolvemos o dinheiro").
- Garantias fortes aumentam o lucro — o ganho de conversão supera os reembolsos.

### 3.5 FAQ: Matador de Objeções
- O FAQ não é só para perguntas — é para matar objeções DISFARÇADAS!
- Inclua:
  - "Para quem é?"
  - "Quanto tempo para começar?"
  - "Como funciona a garantia?"
  - "Posso usar minha marca?"
  - "Como recebo os pagamentos?"
- Use accordion (expansível).
- Bonus: O FAQ também captura tráfego SEO long-tail!

---

## 4. UX e Usabilidade Premium (Regras do Mega Brain)
1. **Mobile-first**: Desenhe primeiro para telas pequenas. Touch targets ≥44-48px, fontes ≥16px, CTA alcançável com polegar.
2. **Time-to-value curto**: Quanto antes o usuário sentir o primeiro valor, maior a retenção.
3. **Acessibilidade é exigência**:
   - Contraste 4.5:1 (texto normal), 3:1 (texto grande)
   - Imagens com alt text
   - Navegação por teclado completa
   - HTML semântico
   - Não comunicar só por cor
4. **Microinterações 150-300ms**: Mais rápido parece quebrado, mais lento parece pesado.
5. **UX writing claro, não esperto**: "Salvar alterações" ao invés de "Vamos lá!". Mensagens de erro acionáveis ("E-mail já cadastrado. Quer fazer login?").
6. **5 usuários = ~85% dos problemas**: Teste pequeno e frequente, não teste grande e raro.

---

## 5. Performance e Velocidade (Core Web Vitals)
- LCP < 2.5s (Maior conteúdo visível)
- INP < 200ms (Interatividade)
- CLS < 0.1 (Deslocamento de layout)
- Otimize imagens: WebP/AVIF, tamanho <100KB.
- NÃO use pop-ups intrusivos.
- A probabilidade de rejeição sobe FORTEMENTE quando o carregamento passa de 1-3s (dados Google).

---

## 6. Como Justificar Preço de R$10k+
Um site premium não é só "linhas de código" — é:
1. **Estratégia de negócio**: Análise de mercado, concorrência, público-alvo.
2. **Identidade visual única**: Não usa templates — tudo do zero alinhado com a marca.
3. **CRO (Conversion Rate Optimization)**: Estrutura de copy, seções, CTAs otimizados para converter.
4. **Performance e segurança**: Core Web Vitals em dia, headers de segurança (CSP, HSTS, etc.).
5. **Suporte pós-lançamento**: Garantia de X dias, manutenção básica.
6. **Resultados**: Mostre case studies ("Cliente X aumentou leads em 40% com o site que fizemos").

---

## 7. Checklist Final para Site Premium
- [ ] Design system aplicado (cores, fontes, grid, spacing)
- [ ] Above the fold responde 4 perguntas em 5 segundos
- [ ] Prova social na hierarquia correta
- [ ] Copy focada em benefícios, não features
- [ ] Garantia mais forte que a lei
- [ ] FAQ com objeções respondidas
- [ ] Mobile-first com touch targets e fontes adequadas
- [ ] Acessibilidade WCAG
- [ ] Core Web Vitals em dia
- [ ] 1 CTA por seção, com maior contraste
- [ ] Nenhuma ilustração genérica (use produto em uso ou resultado real)
- [ ] 1 elemento de animação por página (não polua)
- [ ] Headers de segurança configurados (CSP, HSTS, etc.)

---

## 8. Arquivos de Referência do Mega Brain (Acesse Sempre!)
1. Design System: `docs/design-system-ecossistema-2026-07-03.md`
2. Landing Pages: `knowledge/sources/BASE-CONHECIMENTO-GERAL/SOURCE-BCG008-landing-pages.md`
3. UX/UI: `knowledge/sources/BASE-CONHECIMENTO-GERAL/SOURCE-BCG007-ux-ui.md`
4. Design: `knowledge/sources/BASE-CONHECIMENTO-GERAL/SOURCE-BCG006-design.md`
5. Visão do Toqy (exemplo de produto premium): `projects/toqyapp/.planning/VISION.md`

