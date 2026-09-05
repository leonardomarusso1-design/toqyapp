# Estudo do Linktree — o que ele faz hoje na parte visual/produto

> Criado: 2026-09-05, pedido do Leonardo ("temos que estudar a fundo o Linktree
> e trazer tudo que ele faz hoje na parte visual e colocar no Toqy e melhorar").
> Requisito: LNK-01 (ver ROADMAP.md Phase 6, PROJECT.md).

## Antes de pesquisar: o que já existe no megabrain sobre isso

Checado conforme pedido — **já existe uma diretriz de posicionamento aprovada
antes desta sessão**, repetida em 3 lugares independentes:
- `agents/sua-empresa/products/TOQY.md`
- `agents/cargo/DEV-TOQYAPP/MEMORY.md`
- `inbox/LEONARDO-MARUSSO/ECOSSISTEMA/ecossistema-leonardo-marusso.md`

> "TOQY não deve parecer apenas um 'Linktree brasileiro'. Você quer
> posicioná-lo como uma plataforma premium."

**Não existe**, porém, nenhum estudo funcional/feature-por-feature do
Linktree — só essa diretriz de posicionamento de marca. Este documento é
esse estudo, que faltava.

**Como isso muda a abordagem**: o pedido é estudar o Linktree pra **trazer
funcionalidade e melhorar** — não pra parecer visualmente com ele. Cada
item abaixo tem uma decisão que respeita essa diretriz: adotar o
*comportamento/função* quando faz sentido, nunca a estética "link genérico
empilhado" que é a cara do Linktree.

## Fonte da pesquisa

Pesquisado direto em linktr.ee (página inicial + `/s/features`) em
2026-09-05 — não é conhecimento de memória, é o que o site descreve hoje.

## O que o Linktree oferece hoje

### Monetização
- Loja/afiliados: cura produtos favoritos, ganha comissão por venda
- Produtos digitais (downloads pagos direto na plataforma)
- Cursos (conteúdo educacional pago)
- Reservas/agendamento (com ou sem custo)
- Links patrocinados (marcas pagam por conversão)
- Sistema de "Rewards"

### Engajamento e automação
- Resposta automática no Instagram para comentários
- Editor de fundo via integração com Canva
- Gerador de QR Code personalizado
- Planejador social com agendamento de posts
- Gerador de hashtag/legenda com IA

### Analytics
- Dashboard de comportamento de visitantes
- Cliques em tempo real
- Gerenciador de público com exportação de dados

### Integrações
- Mailchimp, Klaviyo, Kit (coleta de e-mail/formulário)

### Personalização visual
- Temas premium prontos, fontes, fundos, marca própria (branding)
- Encurtador de URL de marca

## Comparação com o Toqy — o que já temos vs. o que falta

| Recurso Linktree | Toqy hoje | Decisão |
|---|---|---|
| QR Code personalizado | ✅ Já existe (`hasCustomQr`, `/app/qr`) | — |
| Analytics de cliques | ✅ Já existe (`toqy_analytics_events`, `/app/analytics`) | Manter, já cobre o essencial |
| Temas/personalização visual | ✅ Já existe (editor completo: cores, fontes, layout, presets) — e mais granular que o Linktree (cores por elemento) | Manter — Toqy já é mais profundo aqui |
| Pagamento/monetização in-page | ⚠️ Parcial — Toqy tem Pix nativo (BR Code, QR, comprovante), que é **melhor pro público brasileiro** que qualquer "loja" genérica do Linktree | **Trazer**: adicionar PicPay/Mercado Pago como botões (feito nesta sessão, ver ICO-01) — não construir uma "loja" completa agora, o Pix já resolve a dor real |
| Catálogo de produtos/serviços | ✅ Já existe, mais rico que a "loja" do Linktree (carrossel/grid/categoria) | Manter |
| Reservas/agendamento | ✅ Já existe (`bookingUrl`, botão "Agendamento") — é um link externo, não um sistema de agenda embutido | **Melhorar depois** (Fase 4 do roadmap, "Google Meu Negócio"), não prioridade agora |
| Editor de fundo via Canva | ❌ Não existe | **Não trazer** — foge do posicionamento premium (dependência de ferramenta externa genérica); o gerador de arte com IA do Toqy já cobre essa necessidade com qualidade maior |
| Resposta automática no Instagram | ❌ Não existe | **Não trazer agora** — fora do escopo de "bio site", é uma feature de automação de outra categoria de produto |
| Planejador social + IA de hashtag/legenda | ❌ Não existe | **Não trazer agora** — mesmo motivo acima, categoria de produto diferente (scheduler de posts) |
| Integração com Mailchimp/Klaviyo | ❌ Não existe | **Considerar como CONT-01/e-mail marketing futuro**, não urgente |
| Vídeo embutido no bio site | ❌ Não existe hoje no catálogo/botões | **Trazer** — já registrado como CARD-03 no roadmap (vídeo + post do Instagram no catálogo), mas **bloqueado até ter feedback real de cliente** (pedido explícito do Leonardo) |
| "Links patrocinados" (ads de terceiros na página) | ❌ Não existe | **Nunca trazer** — quebraria a confiança do bio site do cliente final, incompatível com posicionamento premium |

## Conclusão / decisão

O Linktree, pelo que a pesquisa mostra, está indo pra um modelo de "hub de
monetização genérico" (loja, ads, cursos, scheduler). O Toqy já tem, pro
público de comércio local brasileiro, respostas **melhores e mais
específicas** pros mesmos problemas: Pix nativo em vez de "loja" genérica,
catálogo rico em vez de vitrine simples, QR/NFC físico (plaquinha) que o
Linktree nem tenta cobrir.

**O que realmente vale trazer do Linktree, então, não é feature — é**
disciplina de simplicidade na primeira tela: o Linktree é extremamente fácil
de configurar em poucos minutos no celular. Isso já está sendo tratado
diretamente no **MOB-01** (auditoria mobile-first, concluída nesta sessão)
— que é, na prática, a parte do Linktree que mais merecia ser "trazida e
melhorada": a facilidade de criação pelo celular, não o visual.

**Sem mudança de posicionamento/visual recomendada** — a diretriz existente
("não parecer Linktree brasileiro, ser premium") continua correta à luz
desta pesquisa. Nenhuma feature nova é urgente o suficiente pra abrir mão
disso.

## Próximos passos (se o Leonardo quiser aprofundar mais)

1. Validar com o Ana/Waze real: confirmar se os botões PicPay/Mercado Pago
   recém-adicionados fazem sentido pro público de comércio local (perguntar
   nos próximos feedbacks de cliente, mesmo princípio do CARD-03)
2. Se/quando CARD-03 (vídeo/Instagram no catálogo) for desbloqueado por
   feedback real, é o item mais próximo de "trazer algo do Linktree" que
   ainda falta
3. Revisar de novo em ~6 meses — Linktree lança feature nova com frequência
