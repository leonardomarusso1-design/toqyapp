# Relatório de QA — TOQY (2026-07-03)

> Gerado a partir dos templates em `core/templates/qa-prompts/` (mega-brain).
> Escopo: mobile/responsividade, performance, segurança, LGPD. Mesmo
> tratamento aplicado ao ZapFlow (`projects/ZapFlow/RELATORIO-QA-2026-07-03.md`),
> adaptado à realidade do TOQY (Next.js App Router, não SPA Vite).
> Auditoria + correção direta no código, sem mudar nenhuma funcionalidade
> existente. Os dois templates de teste com usuário/BDD
> (`testes-funcionais-fluxos.md`, `teste-usabilidade-usuario.md`) não foram
> aplicados nesta rodada — são planos de teste com humanos reais, não algo
> que se corrige no código.

## 1. Responsividade / Mobile — ✅ corrigido

**Achado:** `DashboardShell.tsx` (moldura de todo `/app/*`, `/onboarding`,
`/editar/[slug]`) tinha a sidebar completa (logo, CTA "Novo bio site", nav,
rodapé) sempre visível — o grid de 2 colunas (`lg:grid-cols-[260px_1fr]`)
só existia a partir do breakpoint `lg`; abaixo disso os dois blocos
(sidebar e conteúdo) simplesmente empilhavam, com a sidebar inteira
aparecendo ACIMA do conteúdo real da página. Num celular, a pessoa via a
sidebar completa antes de conseguir rolar até a página que veio ver.

**Corrigido:**
- Sidebar virou drawer abaixo do breakpoint `lg` — escondida por padrão
  (`-translate-x-full`), abre com botão hambúrguer novo no header, fecha ao
  clicar fora (backdrop escuro) ou automaticamente ao navegar para outra
  rota (via `useEffect` no `pathname`). A partir de `lg` continua idêntica
  a antes (sempre visível, sem hambúrguer).
- Botão de fechar (X) adicionado dentro do drawer, ao lado da logo, visível
  só em mobile.
- Header do painel ganhou padding reduzido em mobile (`px-4` → `lg:px-8`,
  antes sempre `px-6 lg:px-8`).
- Revisado o restante das páginas do painel/editor quanto a overflow
  horizontal: nenhuma tabela HTML nativa (todas as listas usam cards/flex);
  as duas grades com coluna fixa (`qr/page.tsx`, `SiteBuilder.tsx`) já usam
  breakpoint (`lg:grid-cols-[...]`/`xl:grid-cols-[...]`), então caem para
  1 coluna em telas pequenas sem overflow; a barra de etapas do
  `SiteBuilder` já tinha `overflow-x-auto`.

**Não testado ao vivo:** sem ambiente de browser com screenshot disponível
nesta sessão (Windows, sem `chromium-cli`/Playwright configurado) e sem
credenciais reais do Supabase para logar em `/app/*`. Verificação feita via
`curl` no dev server (rotas retornam 200, sem erro de build, classes novas
presentes no HTML renderizado) e leitura cuidadosa do código. Recomendo
teste manual num celular real antes de publicar.

## 2. Performance — ⚠️ avaliado, sem mudança de código

**Contexto:** TOQY é Next.js App Router (Turbopack), não uma SPA Vite como
o ZapFlow — o code splitting por rota já é automático (cada página em
`src/app/` vira seu próprio chunk; o build confirma isso). O achado de
"bundle único de 1.4MB" que motivou a correção no ZapFlow não se aplica
aqui.

**Investigado e decidido não aplicar:**
- **`next/image`:** configurado em `next.config.ts` (AVIF/WebP,
  `minimumCacheTTL`) mas não usado em lugar nenhum — todo o app usa `<img>`
  puro. Avaliei converter os logos estáticos (`/brand/*.png`) para
  `next/image`, mas os arquivos `public/brand/*.png` são na verdade JPEG
  (confirmado via `file`), todos com 1920×1920px — dimensão quadrada
  inconsistente com o nome "horizontal" e com o uso real (`h-8 w-auto`
  etc). Sem saber a proporção visual real do logotipo dentro do arquivo,
  converter agora arriscaria esticar/espremer a logo (next/image exige
  `width`/`height` batendo com a proporção real da imagem). Decidi não
  arriscar uma regressão visual por uma otimização de performance marginal
  — fica documentado para quando alguém puder confirmar as dimensões
  corretas.
  - As imagens de avatar/logo de usuário (`profile.avatar_url`,
    `site.profile.logoUrl`) são data URLs base64 geradas no upload
    (`ImageUploadField.tsx`), não arquivos remotos — não se beneficiam de
    `next/image` (que otimiza para domínios remotos configurados).
- **Dependência não usada:** `motion` (sucessor do `framer-motion`) está em
  `package.json` mas tem **zero** ocorrências de import em `src/`. Aumenta
  o tempo de install/`node_modules` sem necessidade. Não removi
  unilateralmente (mudança de dependência é mais sensível), mas fica
  sinalizado — se ninguém tiver planos de usar, pode sair do
  `package.json`.
- **Client components:** o app já usa `"use client"` de forma pontual
  (páginas com `useEffect`/Supabase), é o padrão que o projeto já seguia
  antes desta sessão — não é uma regressão a corrigir agora.

## 3. Segurança — ✅ 1 correção real + headers reforçados

**Achado real (mais sério que os do ZapFlow):** `src/app/api/kiwify/webhook/route.ts`
não tinha NENHUMA verificação de autenticidade — aceitava qualquer POST
como se fosse a Kiwify. Como o handler confia diretamente no corpo da
requisição (`webhook_event_type`, `Product.product_name`, `Customer.email`)
pra decidir se libera um plano pago, **qualquer pessoa que descobrisse a
URL podia se auto-conceder o plano Agência (100 bio sites) de graça**,
sem pagar nada, só enviando o JSON certo pra esse endpoint.

**Corrigido (mesmo padrão do `mp-webhook`/`zapi-webhook` do ZapFlow):**
verificação por token na URL, **opcional** — só entra em vigor se a env
`KIWIFY_WEBHOOK_TOKEN` estiver configurada. Sem ela, comportamento idêntico
a antes (não quebra nada em produção até alguém configurar). Pra ativar:
gerar um segredo, configurar `KIWIFY_WEBHOOK_TOKEN` nas envs, e atualizar a
URL cadastrada no painel da Kiwify pra
`https://.../api/kiwify/webhook?token=SEU_SEGREDO`.

**Verificado e sem problema (diferente do ZapFlow, que tinha o token Z-API
exposto no navegador):**
- `SUPABASE_SERVICE_ROLE_KEY` (usada em `src/lib/supabaseServer.ts`) só é
  referenciada em Server Components sem `"use client"`
  (`src/app/[slug]/page.tsx`, `src/app/b/[slug]/page.tsx`) e em API routes
  (sempre server-side no Next.js) — nunca chega ao bundle do navegador.
  Nenhuma chamada direta a API externa com token exposto no client-side.
- Sentry DSN é público por design (não é um achado de segurança).

**Headers reforçados** (`next.config.ts`): já existiam `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (mais
avançado que o ZapFlow estava antes do QA dele). Adicionado:
- `Strict-Transport-Security` (HSTS, 2 anos + subdomínios + preload)
- `Content-Security-Policy` — sem nonce (abordagem recomendada pelos docs
  do Next.js pra manter a geração estática das páginas; CSP com nonce
  forçaria renderização dinâmica em tudo). `script-src`/`style-src` usam
  `'unsafe-inline'` por causa disso — proteção mais fraca contra XSS que a
  versão com nonce, mas cobre clickjacking, MIME sniffing e restringe
  `connect-src` a `'self'` + Supabase (`*.supabase.co`, incluindo
  websocket) + Sentry (`*.ingest.de.sentry.io`). Testado no dev server:
  headers presentes na resposta, páginas continuam renderizando (200,
  sem tela em branco).

## 4. LGPD — ⚠️ gap documentado, não corrigido (decisão de negócio)

**Achado:** não existe nenhuma página de política de privacidade ou termos
de uso no app (busquei por `/privacidade`, `/termos`, e qualquer link pra
essas páginas na landing — nada encontrado). O onboarding e o cadastro
coletam dados pessoais reais (nome, e-mail, telefone, WhatsApp, endereço
do negócio do cliente final) sem qualquer aviso de privacidade vinculado.

**Não corrigido de propósito:** política de privacidade é decisão jurídica/
de negócio (o que é coletado, por quanto tempo, com quem é compartilhado,
DPO se aplicável), não algo que se escreve no código sem a definição de
conteúdo de alguém responsável. Mesmo tratamento dado ao ZapFlow.

## Resumo

| Item | Status |
|---|---|
| Mobile (drawer da sidebar) | ✅ Corrigido |
| Performance (code splitting) | N/A — já automático (Next.js App Router) |
| Performance (`next/image`, dependência não usada) | ⚠️ Avaliado, não aplicado (ver riscos acima) |
| Segurança (webhook Kiwify sem autenticação) | ✅ Corrigido (token opcional) |
| Segurança (service role key, tokens client-side) | ✅ Sem achados |
| Segurança (headers HSTS + CSP) | ✅ Adicionado |
| LGPD (política de privacidade) | ⚠️ Gap documentado, decisão de negócio |
