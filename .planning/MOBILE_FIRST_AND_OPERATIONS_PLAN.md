# Planejamento Técnico: Mobile-First UX, Escala & Centralização Operacional

Este documento detalha o plano de desenvolvimento e engenharia para as melhorias de UX no celular, estabilização de segurança no banco de dados e a centralização do controle operacional do **ToqyApp**.

---

## 1. Novo Fluxo de Edição Mobile-First

### 📱 O Desafio do Celular
Arrastar elementos (drag-and-drop) em telas pequenas gera toques acidentais, lag e frustração. A nova interface do `SiteBuilder.tsx` será baseada em **Cards Expansíveis em Acordeão**.

### 🛠️ Estrutura de Cards (Accordion-based)
Em vez de uma tela longa ou abas tradicionais que cortam o fluxo de visualização, o criador no celular funcionará em 6 módulos recolhíveis de fácil manuseio:

1.  **🏷️ Segmento & Estilo**: Escolha do modelo do comércio local e preset de cores/botões.
2.  **👤 Informações Básicas**: Nome do estabelecimento, foto de perfil, logo e descrição.
3.  **📞 Links Rápidos (Contatos)**: WhatsApp, telefone, email e redes sociais principais.
4.  **💸 Módulos de Conversão (Pix e Wi-Fi)**: Configuração de chaves Pix e credenciais Wi-Fi.
5.  **🛍️ Catálogo de Produtos**: Lista de itens com carrossel ou grade de fotos.
6.  **🎯 Avaliação Google**: Script e atalho rápido do Google Maps.

#### UX do Reordenamento no Celular:
*   Cada link ou produto listado dentro de um Card possuirá botões dedicados de **Mover para Cima** (`ArrowUp`) e **Mover para Baixo** (`ArrowDown`) com feedback tátil (vibração curta de celular via `navigator.vibrate([15])` onde disponível).

### 👁️ Floating Live Preview Overlay
*   Um botão flutuante discreto com o ícone de um olho (`Eye`) acompanha o scroll do editor.
*   Ao ser clicado, abre um modal em tela cheia com o componente `PublicBioSite` carregado com o estado atual das edições locais em memória (não salvas), permitindo visualizar o site exatamente como o cliente final verá no telefone, com um botão rápido no topo: *"Voltar a editar"*.

---

## 2. Segurança e Escalabilidade de Banco de Dados

### ⚡ Índices de Alta Performance (Supabase / Postgres)
Para garantir que buscas públicas de bio sites respondam em menos de 50 milissegundos mesmo com milhões de registros no banco, as seguintes chaves de indexação compostas e parciais devem ser criadas no Supabase:

```sql
-- Busca rápida pública por slug (mais executada do SaaS)
CREATE INDEX IF NOT EXISTS idx_toqy_biosites_slug_active 
  ON public.toqy_biosites (slug) 
  WHERE status = 'active';

-- Busca rápida de biosites pertencentes ao usuário logado
CREATE INDEX IF NOT EXISTS idx_toqy_biosites_owner_created 
  ON public.toqy_biosites (owner_profile_id, created_at DESC);

-- Busca rápida de logs de comissão do revendedor
CREATE INDEX IF NOT EXISTS idx_toqy_commission_ledger_reseller_date 
  ON public.toqy_commission_ledger (reseller_profile_id, occurred_at DESC);
```

### 🔒 Rate Limiting de Proteção
Para blindar o SaaS contra ataques automatizados de descoberta de chaves de acesso (`editKey`), adicionaremos uma lógica de **Rate Limiting baseado em IP** no `src/middleware.ts` do Next.js utilizando um mecanismo de cache em memória rápida (ou redis na Vercel):

```typescript
// Exemplo de integração no middleware.ts
import { rateLimit } from '@/lib/rateLimiter';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteção do endpoint de verificação de chave de edição
  if (pathname.startsWith('/api/sites/') && pathname.endsWith('/verify-key')) {
    const ip = request.ip ?? '127.0.0.1';
    const isRateLimited = await rateLimit(ip, 10, '1m'); // Max 10 tentativas por minuto por IP
    
    if (isRateLimited) {
      return new NextResponse('Muitas tentativas. Tente novamente mais tarde.', { status: 429 });
    }
  }
  
  // ... resto da verificação de sessão ...
}
```

---

## 3. Centralização Operacional: Painel do Fundador (`/app/fundador`)

Uma única rota exclusiva para o Leonardo monitorar as engrenagens sem precisar abrir múltiplas abas de ferramentas externas.

### 🔒 Proteção da Rota
Acesso restrito adicionando um check de e-mail na tabela `profiles` ou no middleware:
```typescript
const ADMIN_EMAILS = ['leonardomarusso1@gmail.com', 'admin@toqy.com.br']; // Carregado do .env
```

### 📊 Módulos do Painel do Fundador
1.  **💳 Vendas & MRR**:
    *   Exibição em tempo real de logs da tabela `toqy_kiwify_events` e `toqy_commission_ledger`.
    *   Gráfico simples de MRR (Mensalidade recorrente acumulada) dos planos Essencial, Freelancer e Agência.
2.  **📧 Resend Delivery Dashboard**:
    *   Integração com a API do Resend (`GET /emails`) para exibir taxa de abertura, bounces (emails inválidos) e reclamações de spam diretamente no painel.
3.  **🐛 Sentry Log Center**:
    *   Consumo do endpoint da API do Sentry (`GET /api/0/projects/{organization_slug}/{project_slug}/issues/`) para listar erros não resolvidos e a contagem de ocorrências das últimas 24 horas.

---

## 4. Roteiro de Automação: Agente Auto-Heal Sentry

Para liberar o Leonardo do monitoramento manual de bugs:

```
Sentry Webhook (Bug) ──► Rota /api/webhooks/sentry ──► Trigger Script (Mega Brain)
                                                             │
                                                             ▼
PR de Correção ◄── Commit local ◄── Executa Testes ◄── Corrige o Código (IA)
```

1.  **Recepção do Erro**: O Sentry detecta uma quebra de tela ou erro de API e dispara um POST webhook para `/api/webhooks/sentry` no ToqyApp.
2.  **Identificação do Arquivo**: O payload do Sentry contém o arquivo exato e a linha que causou o erro (`stacktrace`).
3.  **Acionamento do Agente no Mega Brain**: O servidor do ToqyApp retransmite o stacktrace para o script de auto-heal do Mega Brain (`core/jarvis/auto_heal.py`).
4.  **Auto-Correção**:
    *   O agente de IA abre o arquivo problemático em `projects/toqyapp/`.
    *   Modifica o código para sanar a falha (ex: adiciona validação de undefined, trata tipo incorreto).
    *   Executa os testes locais (`npm run build && npm run lint`).
5.  **Abertura de PR**: Se o build passar com 0 erros, o agente cria uma branch (ex: `fix/sentry-issue-102`), faz o commit e abre um Pull Request no GitHub do projeto, alertando o Leonardo no Discord: *"Bug #102 corrigido de forma autônoma! PR #43 aguardando aprovação."*
