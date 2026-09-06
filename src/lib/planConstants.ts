// Constantes PURAS de plano — este módulo não importa nada e não tem
// nenhum efeito colateral no import.
//
// Por que ele existe (2026-09-06): o CI que acabou de ser criado quebrou
// em `webhookLogic.test.ts`, um teste de lógica pura, com
// "Node.js 20 detected without native WebSocket support" vindo de dentro
// do @supabase/realtime-js. A cadeia era:
//
//   webhookLogic.test.ts -> webhookLogic.ts -> planLimits.ts
//     -> supabaseClient.ts -> createClient() NO IMPORT -> RealtimeClient
//
// Ou seja: pra testar uma função que só compara strings de plano, o
// processo subia um cliente Supabase inteiro com WebSocket. Isso não é só
// chato no CI — é o motivo de a cobertura de teste ser tão baixa
// (achado da auditoria externa): qualquer teste de lógica arrastava
// infraestrutura junto.
//
// Agora as constantes vivem aqui, sem dependência nenhuma. `planLimits.ts`
// continua reexportando as duas pra não quebrar os 9 arquivos que já as
// importavam de lá.

export const PLAN_BIOSITE_LIMITS = {
  free: 1,
  // Pro Pessoal (2026-09-05): 1 site só, de propósito — é pro público que
  // só quer o próprio bio site, não pra revender (ver subscriptions.ts).
  pro: 1,
  community: 10,
  freelancer: 20,
  agency: 100,
} as const;

// Créditos VITALÍCIOS de geração de arte com IA por plano (2026-07-13,
// ajustado 2026-07-16, restaurado no Freelancer na Fase 1 do roadmap
// 2026-07-16 — ver .planning/ROADMAP.md e src/lib/subscriptions.ts). O
// Freelancer virou assinatura mensal e precisava de diferencial real
// frente ao Essencial — ganhou o dobro dos créditos dele (10 vs 5) pra
// justificar o preço mais alto (R$39,90 vs R$29,90). Números iniciais,
// ajustar conforme custo real observado (~R$0,20-0,25 por geração via
// gpt-image-2) — se a demanda for maior que isso, o caminho é vender
// pacotes de créditos extras via Kiwify, não aumentar o limite grátis.
//
// Nota: Essencial e Freelancer agora são recorrentes mensais (não mais
// pagamento único) — "vitalício" neles soa estranho a longo prazo
// (créditos que nunca resetam mesmo pagando todo mês). Reset mensal de
// créditos pra esses planos é uma melhoria futura razoável, não
// implementada agora (exigiria um job recorrente pra zerar
// ai_art_credits_used).
export const PLAN_AI_ART_CREDITS = {
  free: 0,
  // Pro Pessoal não inclui gerador de arte de propósito (decisão do
  // Leonardo, 2026-09-05) — é um recurso pensado pra quem entrega bio
  // site + plaquinha física pra CLIENTE (revenda), não pro uso pessoal.
  pro: 0,
  community: 5,
  freelancer: 10,
  agency: 50,
} as const;

export type PlanTier = keyof typeof PLAN_BIOSITE_LIMITS;
