// Páginas de nicho /para/[slug] (2026-09-08, pacote de SEO/GEO). Cada
// entrada vira uma página estática com copy própria pro segmento —
// mesma estrutura, dor e exemplos diferentes. `segmento` (quando
// existe) precisa bater EXATAMENTE com um item de `segments` em
// onboarding/page.tsx, senão o pré-preenchimento de ?segmento= é
// ignorado (ver comentário lá: "nada de texto arbitrário virando
// segmento").
export type NichePage = {
  slug: string;
  segmento?: string;
  title: string;
  metaDescription: string;
  kicker: string;
  headline: string;
  subheadline: string;
  painPoints: { title: string; text: string }[];
  faq: [string, string][];
};

export const nichePages: NichePage[] = [
  {
    slug: "salao-de-beleza",
    segmento: "Salão de beleza",
    title: "Bio site para salão de beleza — TOQY",
    metaDescription: "Link na bio pronto pra salão de beleza: agendamento pelo WhatsApp, catálogo de serviços com preço e Pix pra sinal. Crie grátis.",
    kicker: "Link na bio para salão de beleza",
    headline: "Sua cliente marca horário sem sair do Instagram",
    subheadline: "WhatsApp com mensagem pronta pra agendar, catálogo de serviços com preço e Pix pra cobrar sinal — tudo numa página só.",
    painPoints: [
      { title: "Menos ida e volta no direct", text: "A cliente vê os serviços e preços antes de chamar — chega perguntando o horário, não \"quanto custa\"." },
      { title: "Sinal garantido com Pix", text: "Cobre um sinal pelo Pix direto na página antes de reservar o horário — menos falta sem aviso." },
      { title: "Endereço que abre o mapa", text: "Um botão leva direto pra rota — sem cliente se perdendo ou ligando pra perguntar onde é." },
    ],
    faq: [
      ["Dá pra mostrar tabela de preços dos serviços?", "Dá. O catálogo mostra cada serviço com foto, nome, descrição e preço — corte, escova, coloração, o que fizer sentido pro seu salão."],
      ["Consigo cobrar sinal antes de confirmar o horário?", "Sim, com Pix integrado (plano Pro em diante) você recebe o sinal direto na página, antes de fechar o agendamento."],
      ["Funciona pra mais de uma profissional no mesmo salão?", "Funciona — você organiza os serviços por categoria e usa o WhatsApp principal do salão para centralizar os agendamentos."],
    ],
  },
  {
    slug: "barbearia",
    segmento: "Barbearia",
    title: "Bio site para barbearia — TOQY",
    metaDescription: "Link na bio pronto pra barbearia: QR Code na cadeira, WhatsApp com mensagem pronta e catálogo de serviços. Crie grátis.",
    kicker: "Link na bio para barbearia",
    headline: "Do QR Code na parede direto pro agendamento",
    subheadline: "Cliente escaneia, vê os serviços, chama no WhatsApp com mensagem pronta e já sai sabendo o preço do corte.",
    painPoints: [
      { title: "QR Code na entrada ou no espelho", text: "Imprima o QR Code do seu bio site e cole na barbearia — quem entra já acessa direto pelo celular." },
      { title: "Preço claro, sem pergunta repetida", text: "Catálogo com corte, barba, combo — cada um com preço visível, sem precisar responder \"quanto é\" toda hora." },
      { title: "Wi-Fi pro cliente que está esperando", text: "Mostra a senha do Wi-Fi na página — sem cliente pedindo pro barbeiro toda hora." },
    ],
    faq: [
      ["Dá pra colocar o QR Code numa plaquinha física?", "Dá — o QR Code do seu bio site pode ser impresso em plaquinha de mesa, adesivo ou cartão, além de funcionar digital."],
      ["Serve pra mostrar antes/depois de cortes?", "O catálogo aceita foto por item — dá pra usar como uma vitrine de trabalhos, não só lista de preço."],
      ["Consigo colocar avaliação do Google?", "Sim, tem botão de avaliação do Google configurável na página."],
    ],
  },
  {
    slug: "restaurante",
    segmento: "Restaurante",
    title: "Bio site para restaurante — TOQY",
    metaDescription: "Cardápio digital com foto e preço, pedido pelo WhatsApp e Pix pra adiantar pagamento. Link na bio pronto pra restaurante. Crie grátis.",
    kicker: "Link na bio para restaurante",
    headline: "Cardápio que abre rápido e já manda o pedido pro WhatsApp",
    subheadline: "Nada de PDF pesado — cardápio com foto e preço, botão de pedir por item e Pix pra adiantar o pagamento.",
    painPoints: [
      { title: "Cardápio que abre na hora", text: "PDF demora e fica ilegível no celular. Aqui o cardápio abre na própria página, com foto e preço de cada prato." },
      { title: "Pedido direto no WhatsApp", text: "Cada item do cardápio pode levar direto pro WhatsApp com o nome do prato já na mensagem." },
      { title: "Pix pra adiantar o delivery", text: "Receba o pagamento antes de sair com a entrega — menos calote, saída mais rápida." },
    ],
    faq: [
      ["Consigo organizar o cardápio por categoria?", "Sim — entradas, pratos principais, bebidas, sobremesas, como fizer sentido pro seu restaurante."],
      ["Dá pra mostrar se está aberto agora?", "Dá, com o card de horário de funcionamento, que mostra \"Aberto\"/\"Fechado\" calculado na hora que o cliente abre o link."],
      ["Substitui aplicativo de delivery?", "Não é a mesma coisa — é o seu canal PRÓPRIO, sem comissão por pedido, pra quem já te segue ou acha seu link."],
    ],
  },
  {
    slug: "autonomos",
    title: "Bio site para autônomos — TOQY",
    metaDescription: "Mini site profissional pra quem presta serviço: portfólio, WhatsApp com mensagem pronta e agenda. Crie grátis, sem programar.",
    kicker: "Link na bio para autônomos",
    headline: "Um link só pra mostrar o que você faz e fechar o contato",
    subheadline: "Portfólio de serviços, WhatsApp com mensagem pronta e agenda — sem precisar contratar site nem designer.",
    painPoints: [
      { title: "Portfólio sem precisar de site caro", text: "Monte seu catálogo de serviços com foto e descrição — sem contratar desenvolvedor nem pagar mensalidade de site." },
      { title: "Agenda direto na página", text: "Cliente escolhe serviço, dia e horário disponível — sem trocar mensagem só pra achar um horário livre." },
      { title: "Um link só pra tudo", text: "Instagram, WhatsApp, Pix e portfólio no mesmo lugar — cole na bio, no currículo ou no cartão de visita." },
    ],
    faq: [
      ["Serve pra qualquer tipo de serviço autônomo?", "Serve — fotógrafo, designer, consultor, personal trainer, professor particular, qualquer prestador de serviço que precisa de um cartão de visita digital."],
      ["Preciso saber programar?", "Não. O editor visual monta a página sem precisar escrever uma linha de código."],
      ["Tenho como receber pagamento adiantado?", "Sim, com Pix integrado (plano Pro em diante) — útil pra cobrar sinal antes de um serviço."],
    ],
  },
];

export function getNichePage(slug: string): NichePage | undefined {
  return nichePages.find((p) => p.slug === slug);
}
