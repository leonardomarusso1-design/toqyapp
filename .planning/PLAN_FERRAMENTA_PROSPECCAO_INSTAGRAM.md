# Planejamento: Ferramenta de Prospecção do Instagram (Toqy Prospector)

## Visão Geral
Uma ferramenta dentro do Toqy que ajuda usuários (especialmente revendedores) a encontrar potenciais clientes no Instagram, identificar quais não tem bio site profissional, e gerar uma mensagem/ proposta pronta para contato, inclusive com um bio site mockup gerado automaticamente.

---

## Funcionalidades Principais (MVP)

### 1. Filtro e Busca por Nicho
- Campo para o usuário inserir nicho (ex: "barbearia em São Paulo", "estética em Rio de Janeiro", "restaurante japonesa em Curitiba")
- Integração com alguma API de busca do Instagram (ou scraper simplificado, cuidadosamente para não violar TOS)
  - Alternativa: Integração com uma ferramenta como Phantombuster ou um serviço próprio
- Mostra lista de perfis encontrados, com:
  - Foto de perfil
  - Nome/Username
  - Bio
  - Se tem link na bio (e o que é)
  - Se já tem um bio site profissional ou só Linktree/Instagram
  - Tipo de perfil (pessoal/empresarial)

### 2. Filtro Inteligente
- Mostrar apenas perfis que:
  - NÃO tem um bio site profissional (ou só tem Linktree/Carrd)
  - Tem pelo menos X seguidores (configurável)
  - Posta regularmente
  - É um negócio local/empreendimento (não celebridade/pessoal)
- Marcar perfis que já são clientes do Toqy (para não abordar)

### 3. Gerador de Bio Site Mockup
- Quando o usuário seleciona um perfil, o sistema automaticamente cria um bio site de exemplo usando:
  - Foto do perfil do Instagram
  - Nome do negócio
  - Bio do Instagram
  - Gerar um logo básico com IA
  - Escolhe um template adequado ao nicho
- O bio site mockup fica acessível via um link temporário (ex: `toqy.com.br/mockup/abc123`)

### 4. Gerador de Script de Mensagem
- Cria um script personalizado para enviar por DM no Instagram ou WhatsApp, com:
  - Cumprimento personalizado
  - Mostra o problema (não tem um bio site profissional, link na bio é confuso)
  - Proposta de valor do Toqy
  - Link para o mockup do bio site
  - Oferta especial (ex: "14 dias grátis" ou "1 bio site criado por nós na hora")

### 5. Dashboard de Prospects
- Lista de prospects salvos
- Status: "Contatado", "Respondeu", "Cliente", "Não interessado"
- Histórico de contatos
- Link para mockup do bio site de cada prospect

---

## Integração Técnica

### 1. Backend (Next.js API Routes)
- `/api/prospector/search`: Busca perfis no Instagram por nicho
- `/api/prospector/mockup`: Gera bio site mockup temporário
- `/api/prospector/script`: Gera script de mensagem personalizado
- `/api/prospector/save`: Salva prospect no banco de dados

### 2. Banco de Dados (Supabase)
Nova tabela `toqy_prospects`:
- `id` (uuid)
- `owner_profile_id` (uuid, FK para profiles)
- `instagram_username` (text)
- `instagram_profile_url` (text)
- `business_name` (text)
- `niche` (text)
- `has_bio_site` (boolean)
- `mockup_url` (text, opcional)
- `status` (text: "new" | "contacted" | "client" | "not_interested")
- `notes` (text, opcional)
- `created_at` (timestamptz)

### 3. Integração com IA (opcional)
- Usar Gemini ou GPT para extrair informações do perfil (nome do negócio, nicho)
- Gerar logo básico com IA (DALL-E ou Gemini Image)
- Personalizar o script de mensagem com IA

---

## Problemas e Soluções
- **Violando TOS do Instagram**: Usar uma API oficial ou um provedor terceirizado que esteja em conformidade. Não usar scrapers diretos.
- **Links temporários expiram**: Mockups expiram após 7 dias (e avisar o usuário)
- **Responsividade mobile**: Todo o fluxo deve ser mobile-first, pois muitos usuários vão usar no celular

---

## Prioridade de Implementação
1. Filtro e Busca (manual ou via API)
2. Dashboard de Prospects
3. Gerador de Script de Mensagem
4. Gerador de Bio Site Mockup
