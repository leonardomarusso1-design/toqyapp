# ToqyApp — Visão de Longo Prazo: "Agência de Presença Digital em uma Caixa"

> Criado 2026-07-16 a partir de pedido direto do Leonardo. Pesquisa de mercado feita
> via WebSearch (GoHighLevel, Vendasta, SuiteDash, mercado brasileiro de "Consultor
> Google Meu Negócio", nicho de cartões/plaquinhas QR-NFC de avaliação Google).
> Ver seção "Fontes" no fim.

## O pivô, na visão do Leonardo (verbatim, 2026-07-16)

> "quero um dia fazer o toqy se tornar realmente uma empresa... quero que se torne
> apenas um saas para criar biosites premium com tecnologia, e outras coisas que
> agregam... o toqy tem que se tornar um site para pessoas que querem vender esse
> serviço na rua, na internet, tem que ser completo, ter blogs, ebooks gratuitos,
> artigos... ele não deve ser procurado por alguém que só quer fazer biosite, eu
> mesmo uma hora não quero vender biosites na rua, quero que pessoas assinem o toqy
> para ganhar dinheiro fazendo isso."

Tradução em uma frase: o Toqy para de ser "uma ferramenta de bio site" e passa a ser
**a caixa de ferramentas + o playbook de renda pra quem quer vender presença digital
pro comércio local** — bio site, Pix, Wi-Fi, QR, NFC, avaliação Google, cardápio
digital, plaquinha física — com o Leonardo (e futuros funcionários) rodando a
empresa, não vendendo plaquinha na rua pessoalmente.

## O que a pesquisa confirmou

### 1. O modelo já existe e funciona — em outro nicho (GoHighLevel, Vendasta)

GoHighLevel: 3 planos — Starter $97/mês (uso próprio) → Agency Unlimited $297/mês
(múltiplos sub-clientes) → **Agency SaaS Pro $497/mês (modo revenda: white-label
completo, provisiona conta de cliente automaticamente, você define o preço que
cobra do seu cliente, re-fatura uso)**. Conta pública deles: 10 clientes a
$297/mês = $2.970 de receita, custo de plataforma $497 = ~$2.473/mês de margem
pra quem revende. Vendasta usa modelo parecido (marketplace de 250+ produtos
revendáveis, storefront com sua marca).

**O padrão em TODAS as plataformas pesquisadas**: o produto físico (cartão NFC,
plaquinha) é sempre um **hook de aquisição de baixo custo/pagamento único** — a
receita de verdade é sempre a **assinatura recorrente**. Nenhuma cobra por unidade
física como modelo principal.

### 2. O nicho de "revenda de QR/NFC/avaliação Google" já existe internacionalmente

Cartões NFC/QR de avaliação Google já são vendidos (ProsperQR, ReviewsCard, TAPro,
V1CE) — normalmente pagamento único, QR/NFC dinâmico (aponta pra um link que pode
mudar sem reimprimir, exatamente o que já construímos no `/app/qr` do Toqy). Achei
um precedente direto: um "consultor GoHighLevel" no Reino Unido usa um cartão
NFC/QR de avaliação Google **grátis como isca** pra puxar cliente pra dentro do
funil pago de verdade (a plataforma recorrente). Mesma lógica que o Toqy já tem
embrionária com a plaquinha.

### 3. No Brasil, o nicho de RENDA já existe e é vendido — só não com essas ferramentas

**"Consultor Google Meu Negócio" é uma categoria já nomeada e monetizada no Brasil**
— cursos reais vendendo a promessa "do zero aos R$10 mil/mês", certificação em
até 28 dias, "20 clientes pagando R$500 = R$10.000/mês" (consultorgmn.com.br,
gbpcheck.com/pt/mentores, curso na Hotmart, até o Sebrae vende curso de Google
Meu Negócio). **Ninguém empacotou isso com bio site + QR + NFC + Pix + Wi-Fi +
cardápio como kit de ferramentas** — o discurso de renda já existe e já vende,
falta a ferramenta completa por trás.

### 4. Treino/certificação como canal de aquisição (não só educação)

GoHighLevel roda uma "Academy" com certificação (renovável, exige atividade) E um
**diretório público de certificados que gera lead pro revendedor certificado** —
ou seja, virar "certificado" não é só aprender, é aparecer numa lista que traz
cliente. Mecanismo replicável: "Consultor Certificado TOQY", com diretório
público, conectado ao programa de indicação que já existe (quem tem +indicações
convertidas pode subir de nível/aparecer em destaque no diretório).

## O que isso muda no Toqy — proposta concreta

### A) Reposicionamento dos planos (não são só "limites de bio site")

Os planos já deixaram de ser só "quantos bio sites" com a mudança de hoje (QR
editável + gerador de arte exclusivos de Essencial/Agência) — isso já estava, sem
perceber, alinhado com o padrão GoHighLevel (funcionalidade de revenda só nos
tiers de cima). Próximo passo natural: nomear isso explicitamente na landing —
não "planos de bio site", e sim **plano de negócio**:

| Tier hoje | Reposicionamento sugerido |
|---|---|
| Gratuito | "Teste a ferramenta" |
| Essencial (R$29,90/mês) | "Comece a vender" — ferramentas completas, ticket de entrada baixo, ideal pra quem tá validando a renda extra |
| Freelancer (R$59,90 único) | "Só a ferramenta" — quem já sabe que vai usar e não quer recorrência, sem os recursos de revenda |
| Agência (R$149,90 único) | "Rode como negócio" — branding próprio, domínio, equipe |

### B) Feature que falta e é citada explicitamente pelo Leonardo: avaliação Google como modo de QR dedicado

Hoje `/app/qr` tem modos Bio site / Pix / Link personalizado. O gerador de arte
(`plaqueGenerator.ts`) já tem um `PlaqueType: "google_review"`, mas o **QR
avulso não tem um modo "Avaliação Google" dedicado** (só dá pra fazer via "Link
personalizado" colando a URL manualmente). É um gap pequeno de implementar e
citado por ele como um dos 5 pilares ("seja uma avaliação do Google").

### C) Cardápio digital — já existe parcialmente, falta nomear

O "Catálogo flexível" que já existe (carrossel/grid/categorias/lista) já cobre
tecnicamente o caso de uso de cardápio de restaurante — falta só **posicionar/
nomear isso explicitamente como "Cardápio Digital"** na landing e nos materiais,
não construir do zero.

### D) Conteúdo — não "como usar o Toqy", e sim "como ganhar dinheiro com isso"

Copiar o ângulo que já vende no Brasil (Consultor GMN), não inventar um novo:

- **Ebook isca**: "Como ganhar até R$10 mil/mês vendendo presença digital pro
  comércio local (bio site, QR, avaliação Google e plaquinha)" — mesma estrutura
  de promessa que já é validada no mercado (consultorgmn.com.br), diferencial é
  que o Toqy dá a ferramenta junto, não só o curso.
- **Blog com títulos específicos, não genéricos** (achado da pesquisa: conteúdo
  específico converte mais que genérico) — "Quanto cobrar por uma plaquinha de
  avaliação Google", "Como conseguir os primeiros 5 clientes de bio site",
  "Script pronto pra oferecer presença digital pra uma clínica".
- **Diretório "Consultor Certificado TOQY"** — versão simples: uma página pública
  listando quem completou algum critério (ex: X bio sites criados + Y indicações
  convertidas), com link pro contato da pessoa — vira prova social pra ela E gera
  mais um motivo pra usar o link de indicação que já existe.

### E.1) DECISÃO CONFIRMADA (2026-07-16): Agência vira revenue-share, não mensalidade

Correção sobre a decisão E abaixo — o Leonardo refinou: pra Agência (o tier
white-label) especificamente, em vez de assinatura mensal, o modelo vira
**acesso gratuito à plataforma white-label + 30% de comissão pro Toqy sobre
cada venda que o revendedor fizer pros próprios clientes (70% fica com o
revendedor)**. Essencial continua assinatura mensal fixa (R$29,90); é só
Agência que muda de "pagamento pela ferramenta" pra "comissão sobre o
resultado" — modelo de marketplace, não de SaaS fee fixo.

**Por que isso é uma mudança grande, não só de preço** (registrado aqui pra
não ser subestimado quando a fase de Planos/Preços for planejada de verdade):
- Hoje, quem compra Agência é o próprio revendedor pagando o Toqy — os
  CLIENTES FINAIS do revendedor nunca pagam nada direto pro Toqy. Pra ter 30%
  de comissão de verdade (não "confiar na palavra"), o pagamento do cliente
  final precisa passar pelo checkout do Toqy de algum jeito — reabre a
  pergunta técnica real: como o dinheiro entra?
  - Opção A: Kiwify tem "coprodução" (split de receita nativo entre produtor
    principal e coprodutor) — precisa confirmar se dá pra configurar 70/30
    dinâmico por revendedor, ou se é fixo por produto cadastrado manualmente
  - Opção B: gateway próprio com split automático (Pagar.me, Asaas com
    sub-contas, Stripe Connect) — mais controle, mais trabalho de integração
  - Opção C: o revendedor cobra o cliente dele por fora (Pix direto, etc.) e
    reporta/paga os 30% pro Toqy manualmente — mais simples de construir,
    mas depende de confiança/honestidade, sem trava técnica real
- Precisa definir exatamente **o que conta como "um serviço vendido"** —
  é quando o cliente final assina um plano Toqy através do revendedor? É
  quando o revendedor vende uma plaquinha física? Os dois? Isso muda o
  desenho de dados e de onde o tracking de venda acontece.

**Fica registrado como decisão de produto CONFIRMADA, mas com desenho técnico
ainda em aberto** — vira sua própria fase no ROADMAP.md (fase de Revenue
Share), não é uma mudança de 1 linha de preço.

### E) DECISÃO CONFIRMADA (2026-07-16): todos os planos pagos viram assinatura mensal

Era pergunta em aberto nesta mesma nota — o Leonardo confirmou: "todos depois
tem que ser assinatura mensal". Bate exatamente com o padrão de mercado
pesquisado (em TODO exemplo estudado — GoHighLevel, Vendasta — a receita real é
100% recorrente, nenhuma delas vende pagamento único como produto principal).

Freelancer e Agência (hoje pagamento único via Kiwify) precisam virar assinatura
mensal. Implicações técnicas reais, não só de preço:
- Novos produtos recorrentes na Kiwify pra Freelancer e Agência (os produtos
  atuais são pagamento único — não dá pra só mudar o preço do mesmo produto)
- `contrato-assinatura/page.tsx` reescrito — hoje o texto é explícito que só
  Essencial é recorrente ("apenas o plano Essencial é uma assinatura... os
  planos Freelancer e Agência são pagamento único")
- Quem JÁ comprou Freelancer/Agência como pagamento único precisa continuar
  com acesso vitalício (não pode virar cobrança recorrente pra quem não
  assinou isso) — precisa de um flag tipo `legacy_one_time_purchase` no
  profile pra não confundir com quem entrar depois já na assinatura
- `kiwify/webhook/route.ts` (`resolvePlan`) precisa reconhecer os novos
  produtos recorrentes
- Preço pode (deve?) ser recalculado pra fazer sentido como mensal — R$59,90
  e R$149,90 como preço de assinatura mensal provavelmente precisam ser bem
  mais baixos que o preço de pagamento único atual (decisão de preço, não só
  de mecanismo de cobrança — fica pra planejamento da Fase de Planos/Preços).

## Próximos passos sugeridos (em ordem de esforço crescente)

1. Modo "Avaliação Google" dedicado em `/app/qr` (pequeno, reaproveita o que já existe)
2. Renomear/posicionar "Catálogo" como também servindo "Cardápio Digital" (só copy)
3. Reposicionar a landing page em torno de "plano de negócio", não "plano de bio site" (copy + talvez nova seção "Ganhe dinheiro com o Toqy")
4. Primeiro ebook isca + página de captura
5. Diretório de "Consultor Certificado" (mais trabalho — precisa de critério de certificação + página pública)
6. Decisão de médio prazo: recorrência também em Freelancer/Agência

## Fontes

- GoHighLevel pricing/reseller: gohighlevel.com/pricing, ghlexperts.com/agency-saas/how-to-white-label-ghl
- GoHighLevel Academy/certificação: gohighlevel.com/certifications, gohighlevel.com/post/introducing-highlevel-academy
- Vendasta: vendasta.com/pricing, vendasta.com/blog/agency-content-strategy, vendasta.com/blog/lead-generation-plan
- Cartões NFC/QR de avaliação Google (mercado internacional): ProsperQR, ReviewsCard, TAPro, V1CE, julianmills.co.uk/free-nfc-qr-google-review-card-reviewboost-pro
- Nicho "Consultor Google Meu Negócio" no Brasil: consultorgmn.com.br, gbpcheck.com/pt/mentores, Hotmart (Ronaldo Mafra Junior), Sebrae
- Taggy Contact (concorrente direto, analisado antes nesta mesma sessão): taggycontact.com — cartão físico pagamento único, revenda 20% digital / até 50% física
