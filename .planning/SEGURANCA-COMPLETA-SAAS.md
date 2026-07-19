# Guia Completo de Segurança para Todos os seus SaaS

> Versão: 1.0
> Data: 2026-07-19
> Autor: Leonardo Marusso (via Mega Brain)
> Arquivos Originais: `projects/ZapFlow/.planning/SECURITY-STANDARDS.md`, `core/templates/qa-prompts/seguranca-web-owasp.md`, `core/templates/legal-kit/README.md`, `agents/cargo/DEV-TOQYAPP/MEMORY.md`

---

## Introdução
Este documento é o **padrão obrigatório de segurança para TODOS os seus projetos SaaS** (ToqyApp, ZapFlow, e quaisquer futuros). Ele é baseado em auditorias reais, não em teoria, e contém checklists, ferramentas e referências prontas para usar.

---

## 1. Padrões de Segurança Técnica (Código e Infraestrutura)

### 1.1 Checklist de Segurança Técnica (OWASP Top 10 Adaptado)
| Item | O que Fazer | Status (ToqyApp) | Status (ZapFlow) |
|------|-------------|-----------------|-----------------|
| **Autenticação e Sessões** | Migrar token do `localStorage` para `cookie httpOnly + Secure + SameSite=Strict` | ❌ Faltando | ❌ Faltando |
| | Ativar MFA (autenticação de dois fatores) no Supabase Auth | ❌ Faltando | ❌ Faltando |
| | Ativar OAuth (login com Google/GitHub) | ❌ Faltando | ❌ Faltando |
| **Autorização (RLS)** | Garantir que TUDO use Row Level Security no Supabase | ✅ Feito | ✅ Feito |
| **Rate Limiting** | Implementar `Upstash Ratelimit` nos endpoints: <br> 1. `api/sites/[slug]/verify-key` (prioridade 1) <br> 2. `api/kiwify/webhook` <br> 3. `api/analytics/track` | ❌ Faltando | ❌ Faltando |
| **Erros em APIs** | Logar erro real no servidor, devolver mensagem genérica pro cliente (nunca stack trace ou erro do Postgres) | ❌ Faltando | ❌ Faltando |
| **Upload de Arquivos** | Bloquear explicitamente `image/svg+xml` (SVG pode ter scripts) | ❌ Faltando | ❌ Faltando |
| **Dependências** | Ativar Dependabot + Secret Scanning no GitHub | ❌ Faltando | ❌ Faltando |
| **Headers de Segurança** | Manter a configuração existente em `next.config.ts` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | ✅ Feito | ❌ Verificar `vercel.json` |
| **DDoS/Cloudflare** | Adicionar Cloudflare na frente do domínio como proxy/WAF | ❌ Faltando | ❌ Faltando |
| **Monitoramento de Erros** | Usar Sentry (ToqyApp já tem; confirmar que captura erros server-side; replicar no ZapFlow) | ✅ Feito | ⚠️ Verificar |

### 1.2 Arquivos de Referência de Código
- **ToqyApp Next Config**: `projects/toqyapp/next.config.ts` (headers de segurança)
- **Supabase SSR Cookie**: Usar `@supabase/ssr` em vez do cliente padrão para migrar de `localStorage` para cookies
- **Rate Limiting**: `Upstash Ratelimit` (serverless-native para Vercel/Edge Functions)

---

## 2. Kit Jurídico (LGPD e Documentos Oficiais)
Todos os projetos devem ter os seguintes documentos, usando os templates do Mega Brain:

### 2.1 Páginas Públicas Obrigatórias
| Página | Caminho | Status (ToqyApp) |
|--------|---------|-----------------|
| Termos de Uso | `/termos` | ✅ Feito |
| Política de Privacidade | `/privacidade` | ✅ Feito |
| Política de Cookies | `/cookies` | ✅ Feito |
| Contrato de Assinatura | `/contrato-assinatura` | ✅ Feito |
| Banner de Consentimento de Cookies | (na home) | ❌ Faltando (ToqyApp tem analytics) |

### 2.2 Templates no Mega Brain
Localização dos templates (usar sempre estes, não reinventar a roda):
- Pasta: `core/templates/legal-kit/`
- Arquivos:
  - `LICENSE.md` (licença proprietária)
  - `NOTICE.md` (copyright + tecnologias)
  - `AUTHORS.md` (autoria)
  - `POLITICA-DE-PRIVACIDADE.md`
  - `POLITICA-DE-COOKIES.md`
  - `CONTRATO-ASSINATURA-SAAS.md`
  - `RODAPE-PADRAO.md`

### 2.3 Dados Fixos da Empresa (Preencher Templates)
Ler **antes de usar os templates**: `agents/sua-empresa/LEGAL-PROFILE.md`
- Razão social: Marusso Produções
- CPF: 473.503.798-54
- Proprietário: Leonardo Marusso
- Contato: leonardomarusso1@gmail.com / (19) 99705-1919
- Endereço: Indaiatuba - SP
- Instagram: @leomvideomaker
- YouTube: @leomarussobr

---

## 3. Prompts de QA e Auditoria de Segurança
Use estes prompts do Mega Brain para verificar projetos novos:

### 3.1 Prompt de Segurança Web (OWASP)
Localização: `core/templates/qa-prompts/seguranca-web-owasp.md`
- Foco: injeção, XSS, CSRF, autenticação, headers de segurança, LGPD

### 3.2 Prompt de Legal/LGPD
Localização: `core/templates/qa-prompts/legal-lgpd-privacidade.md`
- Foco: políticas, consentimento, manejo de dados pessoais

---

## 4. Prioridade de Implementação (Por Impacto Real)
1. **Rate Limiting no `verify-key`** (gap mais sério, parecido com "porta sem tranca")
2. **Token `localStorage` → `cookie httpOnly` + CSRF** (mesma mudança, não separar)
3. **Esconder erros do Postgres nas APIs**
4. **Banner de consentimento de cookies (ToqyApp)**
5. **Bloquear SVG no upload de arquivos**
6. **Cloudflare na frente do domínio**
7. **OAuth/MFA no Supabase**
8. **Dependabot/Secret Scanning no GitHub**

---

## 5. Stack Recomendada (Manter o que já Funciona)
| Categoria | Ferramenta | Justificativa |
|-----------|------------|---------------|
| Auth + Banco | Supabase | RLS real, MFA/OAuth prontos (só ativar), criptografia padrão |
| Hosting | Vercel | HTTPS automático, integração perfeita com Next.js |
| DNS/WAF | Cloudflare | DDoS, WAF, esconder IP de origem (adicionar em frente ao Namecheap) |
| Pagamentos | Kiwify (planos mensais) | Já integrado, resolve Pix/boleto bem (Stripe Connect só para split de comissão futuro) |
| Monitoramento | Sentry | ToqyApp já tem! Confirmar server-side e replicar no ZapFlow |
| Rate Limiting | Upstash Ratelimit | Serverless-native, funciona na Vercel/Edge Functions |
| Email | Resend | Melhor controle de entregabilidade que o Supabase Email básico |

---

## 6. Referências de Arquivos no Mega Brain
- **Segurança Padrão (ZapFlow)**: `projects/ZapFlow/.planning/SECURITY-STANDARDS.md`
- **Dev-TOQYAPP Memória**: `agents/cargo/DEV-TOQYAPP/MEMORY.md`
- **Kit Jurídico**: `core/templates/legal-kit/`
- **QA Prompts**: `core/templates/qa-prompts/`

---

## 7. Regras Permanentes (Não Negociáveis)
1. **Nunca** commit `.env` (`.gitignore` já está ok, mas lembrar sempre)
2. **Nunca** use `localStorage` para tokens de sessão (usar cookies httpOnly)
3. **Sempre** use RLS no Supabase (não confie só no frontend para autorização)
4. **Sempre** valide/sanitize inputs do usuário (não confie no cliente)
5. **Sempre** esconda erros internos no frontend (nunca exponha stack trace ou erro de banco)
