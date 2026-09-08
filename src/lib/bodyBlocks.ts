import type { BodyBlock } from "./types";

// Blocos reordenáveis do corpo do bio site (2026-09-06 — extraído pra cá
// quando entrou o card de horário do mockup da auditoria externa; antes a
// lista vivia duplicada dentro de PublicBioSite.tsx e SiteBuilder.tsx).
//
// A ORDEM desta constante é a ordem padrão de exibição — e também a
// referência usada pra reencaixar blocos novos em bio sites antigos (ver
// resolveBodyBlockOrder abaixo).
// "leadForm" (2026-09-07, referência Coonexta) entra no FIM — inserir no
// meio empurraria pra baixo blocos de bio sites já publicados (ver o
// comentário grande de resolveBodyBlockOrder logo abaixo).
// "leadForm" virou modal sobreposto (2026-09-08, PublicBioSite.tsx +
// LeadCaptureForm.tsx) — não tem mais posição no corpo pra renderizar,
// mas continua aqui/em BODY_BLOCK_LABELS por compatibilidade (bio sites
// antigos têm "leadForm" salvo em bodyBlockOrder; SiteBuilder filtra
// antes de mostrar a lista arrastável).
export const DEFAULT_BODY_BLOCK_ORDER: BodyBlock[] = ["buttons", "hours", "catalog", "music", "instagram", "leadForm"];

// Rótulos exibidos na lista arrastável do editor.
export const BODY_BLOCK_LABELS: Record<BodyBlock, string> = {
  buttons: "Botões grandes",
  hours: "Horário de funcionamento",
  catalog: "Catálogo",
  music: "Botão do Spotify", // música de FUNDO não ocupa slot (é ambiente, sem posição no layout)
  instagram: "Preview do Instagram",
  leadForm: "Formulário de contato",
};

// Compatibilidade com bio sites já publicados (regra crítica do projeto:
// nenhum site existente pode mudar de aparência sozinho).
//
// Problema real que isso resolve: `bodyBlockOrder` é gravado no banco como
// a lista COMPLETA de blocos conhecidos na época do save. Quando um bloco
// novo aparece no produto (foi o caso de "hours"), todo bio site salvo
// antes tem uma lista sem ele — e um `map` direto sobre a lista salva
// simplesmente nunca renderizaria o bloco novo, mesmo depois de a pessoa
// configurá-lo (ela ligaria o horário e nada apareceria).
//
// A solução aqui reinsere cada bloco ausente na posição padrão dele —
// logo depois do último bloco que o antecede em DEFAULT_BODY_BLOCK_ORDER e
// que a pessoa realmente tem salvo (ex: "hours" cai logo depois de
// "buttons"). A ordem que a pessoa arrastou é preservada integralmente;
// só ganha o bloco que faltava, no lugar certo. Blocos desconhecidos
// (lixo/versão futura) são descartados pra não quebrar o render.
export function resolveBodyBlockOrder(saved?: BodyBlock[]): BodyBlock[] {
  if (!saved?.length) return [...DEFAULT_BODY_BLOCK_ORDER];

  const order = saved.filter((block, index) => DEFAULT_BODY_BLOCK_ORDER.includes(block) && saved.indexOf(block) === index);

  DEFAULT_BODY_BLOCK_ORDER.forEach((block, defaultIndex) => {
    if (order.includes(block)) return;
    let insertAt = 0;
    for (let i = defaultIndex - 1; i >= 0; i--) {
      const position = order.indexOf(DEFAULT_BODY_BLOCK_ORDER[i]);
      if (position >= 0) {
        insertAt = position + 1;
        break;
      }
    }
    order.splice(insertAt, 0, block);
  });

  return order;
}
