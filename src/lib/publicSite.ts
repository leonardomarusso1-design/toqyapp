import type { ToqySite } from "./types";

// VULNERABILIDADE CRÍTICA CORRIGIDA (2026-09-06) — achada durante a
// auditoria de autorização das rotas de API. NÃO estava no relatório da
// auditoria externa.
//
// O que estava acontecendo, ao vivo, em todos os 57 bio sites:
//
// `site_data` (o JSONB inteiro do bio site) guarda `editKey` em TEXTO
// PURO — é a credencial que dá acesso total de edição, a mesma que o
// dono digita em /me. E esse objeto era entregue inteiro pro navegador
// em três lugares diferentes:
//
//   1. Nas páginas públicas (/b/[slug], domínio próprio): o server
//      component passava o objeto completo pro <PublicBioSite>, que é
//      client component — e o Next serializa props de client component
//      DENTRO DO HTML. Confirmado em produção: "editKey" aparecia no
//      código-fonte de toqy.com.br/b/yakisabor. Bastava abrir o site de
//      qualquer cliente e ver o fonte.
//   2. Em GET /api/biosites/[slug] (usado pela vitrine da landing), que
//      devolvia `{ ...site_data }` cru, sem autenticação nenhuma.
//   3. Em GET /api/biosites (listagem) — devolvia TODOS os sites de uma
//      vez, ou seja, a chave de todo mundo numa requisição só. Essa rota
//      não era chamada por nada e foi REMOVIDA.
//
// Com a chave em mãos, um estranho editava o bio site do cliente e podia
// trocar a CHAVE PIX (desviando pagamento) e o número de WhatsApp
// (interceptando contato). Por isso a correção é na ORIGEM: nada que vá
// pro navegador passa sem passar por aqui.
//
// Mesma família do bug corrigido em 2026-07-17 no /me (que vazava
// edit_key_hash pelo cliente Supabase do navegador) — a correção de lá
// resolveu aquele caminho e não viu que estas rotas faziam o mesmo.

/**
 * Remove segredos de um bio site antes de entregá-lo a qualquer
 * superfície pública (página, API pública, props de client component).
 *
 * `PublicBioSite.tsx` não lê `editKey` em lugar nenhum — conferido — então
 * isso não muda nada visualmente. O editor continua funcionando porque
 * recebe a chave por outro caminho: a pessoa digita em /me e a validação
 * roda no servidor (POST /api/sites/[slug]/verify-key), que só devolve os
 * dados DEPOIS de provar que tem a chave.
 *
 * Por que ZERAR o campo em vez de removê-lo do objeto: `editKey` é
 * obrigatório em `ToqySite`, então devolver um `Omit<>` obrigaria a mudar
 * a assinatura de `PublicBioSite`, `LandingBioSiteCard`, `PhoneMockup` e
 * companhia — um refactor de tipos grande no meio de uma correção de
 * segurança urgente. O que importa aqui é que o VALOR não chega ao
 * navegador, e zerar entrega isso sem risco de efeito colateral. Trocar
 * por um tipo público de verdade (`Omit`) fica como faxina posterior.
 */
export function toPublicSite(site: ToqySite): ToqySite {
  return { ...site, editKey: "", userId: undefined };
}
