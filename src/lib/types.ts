export type ButtonStyle = "full" | "icon";
export type ButtonFill = "solid" | "gradient" | "glass";
export type BackgroundType = "solid" | "gradient" | "image";
export type CatalogLayout = "carousel" | "grid" | "stack" | "grouped" | "category-carousel";

// Blocos do CORPO do bio site que a pessoa pode reordenar livremente
// (ver `bodyBlockOrder` em ToqySite). Extraído pra type próprio em
// 2026-09-06, quando entrou o bloco "hours" — assim a lista de blocos
// existe em UM lugar só, em vez de repetida em 3 arquivos.
// "leadForm" (2026-09-07, referência Coonexta — menu "Captura de leads"
// visto no vídeo do Leonardo) entra no FIM da lista de propósito: a
// ordem de DEFAULT_BODY_BLOCK_ORDER é a posição-padrão pra bio sites já
// publicados sem esse bloco (ver resolveBodyBlockOrder em bodyBlocks.ts)
// — inserir no meio empurraria blocos existentes pra baixo em todo
// site já no ar.
export type BodyBlock = "buttons" | "hours" | "catalog" | "music" | "instagram" | "leadForm";

// Sistema de cores unificado (2026-09-06) — ver src/lib/colorRoles.ts
// para a lista de roles e o resolver. Um ColorValue é sólido OU
// gradiente; nunca os dois ao mesmo tempo.
export type ColorValue = { mode: "solid"; value: string } | { mode: "gradient"; from: string; to: string };

// Todo "lugar" colorível do biosite — cada um aparece EXATAMENTE 1 vez
// no editor (ver colorRoles.ts), sem duplicar conceito com outro role
// nem com um controle "global" à parte.
export type ColorRole =
  | "pageBackground"
  | "name"
  | "title"
  | "location"
  | "description"
  | "logoText"
  | "buttonBg"
  | "buttonText"
  | "buttonBorder"
  // Hierarquia primário/secundário (2026-09-06, mockup da auditoria
  // externa) — os botões grandes que NÃO são o CTA principal viram cards
  // claros, subordinados visualmente. Precisam de fundo/texto próprios
  // justamente porque a graça é NÃO usarem a cor cheia do CTA (buttonBg).
  // Só têm efeito quando algum botão foi marcado como principal; sem isso
  // o bio site continua renderizando do jeito antigo (ver PublicBioSite).
  | "secondaryButtonBg"
  | "secondaryButtonText"
  // Card de horário de funcionamento (2026-09-06, mesmo mockup) — elemento
  // novo e opcional, por isso ganha os próprios roles em vez de reaproveitar
  // os do catálogo/botões (conceitos diferentes, ver regra de "1 role = 1
  // lugar reconhecível" no comentário de `colors` abaixo).
  | "hoursCardBg"
  | "hoursText"
  | "socialIconBg"
  | "saveContactText"
  | "callText"
  | "wifiText"
  | "catalogSectionLabel"
  | "catalogTitle"
  | "catalogItemBg"
  | "catalogItemName"
  | "catalogItemDesc"
  | "catalogItemPrice"
  | "catalogItemHighlight"
  | "catalogActionBg"
  | "catalogActionText"
  | "modalIconBg"
  | "footerCreditText";

export type Segment =
  | "barbearia"
  | "salao"
  | "restaurante"
  | "lanchonete"
  | "pastelaria"
  | "loja"
  | "assistencia_tecnica"
  | "clinica"
  | "petshop"
  | "oficina"
  | "delivery"
  | "servicos"
  | "fotografo"
  | "dentista"
  | "outro";

export type ToqyLinkType =
  | "whatsapp"
  | "instagram"
  | "linkedin"
  | "email"
  | "facebook"
  | "pix"
  | "pixHub"
  | "phone"
  | "maps"
  | "wifi"
  | "telegram"
  | "youtube"
  | "tiktok"
  | "spotify"
  | "twitter"
  | "pinterest"
  | "threads"
  | "ifood"
  | "waze"
  | "picpay"
  | "mercadopago"
  | "behance"
  | "pdf"
  | "drive"
  | "image"
  | "website"
  | "menu"
  | "booking"
  | "review"
  | "catalog"
  | "event"
  | "custom";

export type ToqyButton = {
  id: string;
  label: string;
  type: ToqyLinkType;
  url?: string;
  enabled: boolean;
  displayAs?: "icon" | "button"; // "icon" = círculo social, "button" = botão grande
  // CTA principal (2026-09-06, mockup da auditoria externa: "UM CTA
  // primário por seção; ações secundárias visualmente subordinadas").
  // Hoje TODOS os botões grandes têm o mesmo peso visual, então o visitante
  // não sabe qual é a ação que importa. Marcando UM botão aqui, ele vira o
  // único preenchido com a cor cheia e os outros viram cards claros.
  //
  // Compatibilidade (crítica — já existem bio sites de clientes pagantes no
  // ar): enquanto NENHUM botão tiver isPrimary, o bio site renderiza
  // exatamente como sempre renderizou (sem cards claros, sem chevron). O
  // editor garante no máximo 1 primário por bio site (ver ButtonEditor).
  isPrimary?: boolean;
  // Cor individual por botão (2026-09-07, referência Coonexta — vídeo do
  // Leonardo: "alterar as cores de cada botão individualmente"). Hoje só
  // dava pra mudar a cor de TODOS os botões de uma vez (role global
  // `buttonBg`/`buttonBorder`, ver colorRoles.ts). Sem valor aqui, o
  // botão continua usando o role global — zero mudança nos ~57 bio
  // sites que já existem.
  color?: ColorValue;
  // Efeito pulsar (mesma referência): chama atenção pro botão de ação
  // principal (WhatsApp, agendamento). Reaproveita a keyframe
  // `glowPulse` que já existe em globals.css.
  pulse?: boolean;
};

// Horário de funcionamento (2026-09-06, mockup da auditoria externa — card
// "Aberto hoje • 7h às 18h" + endereço + selo verde "Aberto"). Informação
// básica de negócio local, por isso NÃO tem gate de plano: vale pra todos,
// inclusive Gratuito. Totalmente opcional — sem configurar, nenhum card
// aparece e nada muda nos bio sites já publicados.
export type BusinessHoursDay = {
  weekday: number; // 0 = domingo ... 6 = sábado (mesmo índice de Date.getDay())
  closed: boolean;
  open: string;    // "HH:MM"
  // "HH:MM". Se for menor ou igual a `open`, entende-se que o expediente
  // vira a madrugada (ex: bar que abre 18h e fecha 02h) — o cálculo de
  // "aberto agora" trata esse caso olhando também o dia anterior.
  close: string;
};

export type BusinessHours = {
  enabled: boolean;
  days: BusinessHoursDay[];
};

// Agendamento nativo (2026-09-07, referência Coonexta — documento de
// análise: fluxo "escolher serviço → escolher dia → escolher horário →
// confirmar", dentro da própria página pública, não um link externo).
// Reaproveita BusinessHours (acima) como disponibilidade — não existe
// um sistema de "dias liberados" separado; o horário de funcionamento
// JÁ diz quando o negócio atende, então serve como base pros horários
// possíveis de agendar.
export type BookingService = {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number; // opcional — alguns serviços não têm preço fixo
  enabled: boolean;
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price?: string;
  priceValue?: number;
  imageUrl?: string;
  imageLayout: "square" | "horizontal" | "vertical";
  imageFit?: "cover" | "contain";
  imagePosition?: string;
  category?: string;
  subcategory?: string;
  enabled: boolean;
  actionLabel?: string;
  actionUrl?: string;
  highlight?: string;
  order?: number;
  displaySection?: string;
};

export type ToqySite = {
  id: string;
  userId?: string;
  slug: string;
  ownerPlan?: string;
  segment: Segment;
  status: "active" | "draft" | "disabled";
  profile: {
    name: string;
    title?: string;
    description: string;
    location: string;
    profileImageUrl?: string;
    profileImagePosition?: string;
    logoUrl?: string;
    logoFit?: "cover" | "contain"; // cover = preenche tudo, contain = mostra logo inteira
    logoText?: string;      // Texto decorativo abaixo da logo (ex: "BRAVE TATTOO studio")
    logoFont?: "serif" | "mono" | "bold" | "italic"; // Estilo do texto
    logoSignatureUrl?: string; // Imagem de assinatura/segunda logo abaixo da logo principal
    logoSize: "small" | "medium" | "large";
    logoShape: "circle" | "rounded" | "square";
    backgroundImageUrl?: string;
    // Reposicionamento do fundo (2026-09-06, achado ao vivo testando
    // toqy.com.br/b/yakisabor no celular — "a tela fica cortada"): a
    // imagem de fundo sempre usava background-position fixo, então uma
    // imagem que não foi desenhada pra proporção de celular cortava texto
    // nas bordas sem nenhum jeito de ajustar. Mesmo padrão já usado em
    // profileImagePosition (via ImageCropper/react-easy-crop).
    backgroundImagePosition?: string;
    // Capa em vídeo (2026-09-07, referência Coonexta — vídeo do Leonardo:
    // "coloquei um vídeo no banner, olha que coisa mais linda"). Quando
    // presente, substitui backgroundImageUrl no fundo do bio site — mudo,
    // em loop, autoplay (mesma regra de qualquer vídeo de fundo: sem som,
    // senão o navegador bloqueia o autoplay). Ver videoStorage.ts pro
    // limite de tamanho/duração do upload direto.
    backgroundVideoUrl?: string;
  };
  themePresetId?: string;
  theme: {
    mode: "dark" | "light";
    backgroundType: BackgroundType;
    background: string;
    gradientFrom: string;
    gradientTo: string;
    card: string;
    text: string;
    muted: string;
    primary: string;
    secondary: string;
    accent: string;
    buttonFill: ButtonFill;
    buttonStyle: ButtonStyle;
    buttonRadius: "soft" | "rounded" | "pill";
    socialIconStyle?: "brand" | "glass";
    // Tamanho dos ícones sociais com imagem própria (WhatsApp/Instagram/
    // Facebook/localização, 2026-07-16) — só afeta esses 4 tipos, que
    // renderizam sem círculo de fundo (ver PublicBioSite.tsx IMAGE_ICON_TYPES).
    socialIconSize?: "sm" | "md" | "lg";
    // Tamanho do nome/título principal (h1), 2026-07-16 — padrão "md" mantém
    // o tamanho de sempre (text-2xl).
    nameFontSize?: "sm" | "md" | "lg";
    // Fonte do bio site (2026-09-07, referência Coonexta — "Estilo da
    // letra do mini-site"). Sem valor, herda a fonte padrão do app
    // (Manrope) — comportamento idêntico a antes desta feature existir.
    // Ver src/lib/bioSiteFonts.ts pra lista de opções e como cada uma
    // vira uma CSS var.
    fontFamily?: import("./bioSiteFonts").BioSiteFontId;
    // Sombra no nome/título principal, 2026-09-01 (pedido do Leonardo) --
    // undefined/true mantém o comportamento de sempre (drop-shadow-sm +
    // glow em modo escuro); false desliga os dois pra quem não quer.
    nameShadow?: boolean;
    // Ícone + texto, ou só texto, nos botões grandes (não sociais),
    // 2026-09-01 (pedido do Leonardo) -- undefined/"icon-text" mantém o
    // comportamento de sempre.
    mainButtonDisplay?: "icon-text" | "text-only";
    // Alinhamento do texto de localização, 2026-07-16 — padrão "left" mantém
    // o comportamento de sempre (endereço de 2 linhas alinhado à esquerda,
    // rente ao ícone — ver comentário original em PublicBioSite.tsx sobre por
    // que "center" quebrava visualmente endereços longos). "center" é opt-in
    // pra quem prefere o endereço centralizado mesmo com esse trade-off.
    locationAlign?: "left" | "center";
    useBackgroundOverlay: boolean;
    // Ícone social translúcido (2026-09-06, 3ª correção — histórico: a
    // opacidade ficava dentro do mesmo cálculo que decidia cor de marca
    // vs. custom, e regrediu 2x nas mesmas linhas). Agora é uma flag
    // isolada, aplicada como último passo (pega o socialIconBg já
    // resolvido — sólido ou gradiente — e reduz a opacidade), independente
    // de qualquer outra lógica de cor. Substitui socialIconStyle
    // (mantido só pra compatibilidade de leitura de sites antigos).
    socialIconTranslucent?: boolean;
    // Cores granulares — cada "role" é UM lugar reconhecível do biosite,
    // sem duplicar conceito (2026-09-06, reforma completa — antes disso
    // coexistiam um sistema "global" (theme.primary/text/muted/accent/
    // card, editável direto) e este granular, com o global só como
    // fallback invisível: isso criava duplicação real na tela do editor
    // ("Cor dos botões" E "Fundo dos botões" eram o mesmo conceito em 2
    // lugares, "Fundo dos cards" aparecia 2x, etc — exatamente o "muitos
    // lugares repetidos" reportado). Ver src/lib/colorRoles.ts pra lista
    // completa + labels. Cada valor aceita sólido OU gradiente
    // (ColorValue); string simples (formato antigo) continua sendo lida
    // como sólida, via resolveColorStyle().
    colors?: Partial<Record<ColorRole, ColorValue>>;
  };
  plaqueTheme?: {
    useSameBackground: boolean;
    backgroundImageUrl?: string;
    backgroundStyle: BackgroundType;
  };
  contact: {
    phone: string;
    whatsapp: string;
    whatsappMessage: string;
    instagram?: string;
    facebook?: string;
    email?: string;
    website?: string;
  };
  links: {
    googleMapsUrl?: string;
    googleReviewUrl?: string;
    bookingUrl?: string;
    menuUrl?: string;
  };
  pix: {
    enabled: boolean;
    key: string;
    receiver: string;
    bank?: string;
    quickAmounts: number[];
    allowCustomAmount: boolean;
    whatsappProofNumber: string;
  };
  wifi: {
    enabled: boolean;
    ssid: string;
    password: string;
    encryption: "WPA" | "WEP" | "nopass";
    checkinUrl?: string;
    checkinLabel?: string;
    showInline?: boolean; // true = mostra no topo inline, false = só como botão na lista
  };
  // Horário de funcionamento (2026-09-06, mockup da auditoria externa) —
  // ver BusinessHours acima. Ausente/enabled:false = nenhum card renderiza.
  businessHours?: BusinessHours;
  // Agendamento nativo — lista de serviços (config, vive no JSON igual
  // ao catálogo, sem tabela própria) + intervalo entre horários
  // oferecidos. Botão do tipo "booking" abre o modal nativo quando
  // `services` tem pelo menos 1 item habilitado; senão continua indo
  // pro link externo de `links.bookingUrl` (comportamento de sempre —
  // zero mudança pra quem não configurar nada disso).
  services?: BookingService[];
  bookingSlotMinutes?: number; // padrão 30
  catalogLayout: CatalogLayout;
  catalogLayouts?: CatalogLayout[];
  catalogTitle?: string;
  catalogSubtitle?: string;
  catalogWaLabel?: string;
  showCatalogWhatsapp?: boolean; // false = esconde botão WhatsApp nos items do catálogo
  showCatalogTitle?: boolean;    // false = esconde o título do catálogo
  showCatalogSubtitle?: boolean; // false = esconde o subtítulo do catálogo
  showCatalogAction?: boolean;   // false = esconde o botão "Ver" nos items do catálogo
  promoCard?: { enabled: boolean; title: string; description: string; buttonLabel: string; };
  modules: {
    saveContact: boolean;
    whatsapp: boolean;
    instagram: boolean;
    phone: boolean;
    maps: boolean;
    wifi: boolean;
    pix: boolean;
    pixHub: boolean;
    googleReview: boolean;
    booking: boolean;
    catalog: boolean;
  };
  // Figurinhas decorativas (2026-09-05, redesenhado 2026-09-06: posição
  // livre x/y arrastável no preview, igual Canva — pedido do Leonardo. Só
  // faz sentido posição livre AQUI (não nos blocos grandes abaixo) porque
  // um pequeno desencontro de pixels numa figurinha não quebra o layout em
  // telas de tamanho diferente; um bloco inteiro em x/y fixo, quebraria.
  // `key` referencia STICKER_LIBRARY (emoji/forma própria, sem risco de
  // direito autoral — não são os stickers ilustrados do Linktree/WhatsApp).
  // Liberado a partir do Pro Pessoal e nos planos de revenda, exceto
  // Essencial (ver hasStickersAndMusic em subscriptions.ts).
  stickers?: Array<{
    id: string;
    key: string;
    x: number; // 0-100 (%), posição livre dentro do header do perfil
    y: number; // 0-100 (%)
    size: "sm" | "md" | "lg";
    rotation: number; // graus
  }>;
  // Música (2ª revisão, 2026-09-06 — o Leonardo testou o player visível
  // <audio controls> e pediu pra tirar: "tire o de deixar o player da
  // música aparecendo". Vira 2 recursos separados, no molde do bloco
  // "Music Link" do Linktree que ele mandou print:
  //
  // 1) Música de FUNDO tocando sozinha (sem controles visíveis, volume
  //    definido pelo dono) — upload próprio hospedado no Toqy, mesmo
  //    limite de ~60s/~4MB de antes (audioStorage.ts), só mudou de nome
  //    (musicUrl → backgroundMusicUrl) e de comportamento (visível →
  //    autoplay). Compatibilidade: bio sites salvos com `musicUrl` (nome
  //    antigo) são lidos como backgroundMusicUrl na renderização.
  backgroundMusicUrl?: string;
  /** @deprecated usar backgroundMusicUrl — mantido só pra ler sites salvos antes de 2026-09-06 */
  musicUrl?: string;
  backgroundMusicVolume?: number; // 0-100, padrão 40
  // 2) Botão de Spotify — link direto pra uma faixa/álbum (sem OAuth de
  //    conta, isso fica pro roadmap), com label editável e 3 formatos de
  //    exibição, igual às opções do Music Link do Linktree.
  spotifyUrl?: string;
  spotifyLabel?: string; // padrão "Ouça minha música"
  spotifyDisplay?: "icon" | "button" | "preview";
  // Captura de leads (2026-09-07, referência Coonexta — menu "Captura de
  // leads" visto no vídeo do Leonardo: "Suas ferramentas de captura de
  // público"). Formulário simples no bio site público que grava nome +
  // contato numa tabela própria por dono (toqy_leads, RLS por
  // owner_profile_id — ver migration 2026-09-07_toqy_leads.sql), listada
  // no painel em /app/leads. Sem envio de e-mail marketing embutido (isso
  // é maior, fica de fora); só captura e lista.
  leadForm?: {
    enabled?: boolean;
    title?: string; // padrão "Deixe seu contato"
    subtitle?: string;
    // Quais campos de contato pedir, além do nome (sempre obrigatório).
    // Pelo menos um precisa estar marcado — validado no editor.
    askEmail?: boolean;
    askPhone?: boolean;
    askMessage?: boolean;
    buttonLabel?: string; // padrão "Enviar"
  };
  // Pixels de rastreio (2026-09-07, referência Coonexta — documento de
  // análise: grupo "Integrações → Pixels & Rastreio"). Cada bio site
  // pode ter os PRÓPRIOS pixels — diferente do GA do Toqy em si
  // (NEXT_PUBLIC_GA_MEASUREMENT_ID em GoogleAnalytics.tsx, que mede o
  // marketing do Toqy). Isso aqui é o cliente final medindo campanha
  // dele (Meta Ads, Google Ads) na própria página. Renderizado só na
  // página pública de verdade (mesma regra de enableBackgroundMusic —
  // nunca no preview do editor nem na vitrine da landing).
  trackingPixels?: {
    metaPixelId?: string;
    gaMeasurementId?: string;
  };
  // Preview de posts do Instagram "em tempo real" — embed oficial da Meta
  // (`instagram.com/embed.js`), sem API key/login: renderiza cada post ao
  // vivo (like/comentário atuais, puxados pelo próprio Instagram), não é
  // captura estática. Autonomia total (2026-09-06, pedido do Leonardo):
  // vários posts (não só 1), com layout e tamanho escolhidos pela pessoa —
  // NÃO puxa automaticamente do perfil (isso exigiria a API oficial do
  // Instagram/Graph API + app registrado no Meta + OAuth por conta
  // Business, decisão consciente de deixar pra um projeto separado depois).
  //
  // `size` por post (2026-09-06, 2ª revisão — pedido do Leonardo depois de
  // testar: "estão de vários tamanhos... poderia escolher") — antes era um
  // `instagramSize` único pra todos os posts, mas o embed oficial da Meta
  // já varia de altura por post (quadrado/retrato/reels têm proporções
  // diferentes mesmo com a mesma largura), então forçar 1 tamanho global
  // não resolvia a inconsistência visual — cada post agora escolhe o seu.
  instagramPosts?: Array<{ id: string; url: string; size?: "sm" | "md" | "lg" }>;
  // "grid" (2 colunas lado a lado) ficou de fora de propósito — o widget
  // oficial do Instagram não encolhe abaixo de ~326px de largura, então
  // 2 posts lado a lado nunca cabem numa tela de celular (a maioria das
  // visitas). "carousel" virou "slide" de verdade (2026-09-06, 2ª revisão:
  // era auto-scroll contínuo, o Leonardo reportou "ficou muito feio" — os
  // posts têm alturas diferentes entre si e o scroll sozinho desalinhava
  // tudo; agora é 1 post por vez, com paginação e troca manual/swipe,
  // igual um carrossel de app de verdade) e "list" (empilhado) são os 2
  // formatos que realmente funcionam em qualquer tamanho de tela.
  instagramLayout?: "carousel" | "list";
  // Mantido só como fallback pra posts que ainda não têm `size` próprio
  // (bio sites salvos antes desta revisão) — não é mais editável como
  // valor único no SiteBuilder.
  instagramSize?: "sm" | "md" | "lg";
  // Ordem livre das seções do corpo do bio site (2026-09-06, pedido do
  // Leonardo: "o Toqy não pode prender as pessoas a uma coisa só") — cada
  // seção é um BLOCO que a pessoa arrasta pra cima/baixo e intercala como
  // quiser. Título/subtítulo/localização/descrição/assinatura/QR/telefone
  // continuam padronizados (núcleo fixo do bio site, fora desta lista) —
  // só o CORPO (botões grandes, catálogo, música, Instagram) é livre.
  // Undefined = ordem padrão de sempre (compatibilidade com bio sites já
  // criados antes desta feature existir).
  //
  // "hours" entrou depois (2026-09-06, card de horário do mockup da
  // auditoria) — bio sites salvos com uma lista SEM esse bloco não perdem
  // nada: resolveBodyBlockOrder() (src/lib/bodyBlocks.ts) reinsere os
  // blocos ausentes na posição padrão deles, preservando a ordem que a
  // pessoa já tinha arrastado.
  bodyBlockOrder?: BodyBlock[];
  // White label — marca do revendedor no lugar do selo "Criado com TOQY"
  // (2026-09-06, pedido do Guilbert, primeiro assinante do plano Agência).
  // Histórico importante: white label existiu, foi REMOVIDO do produto em
  // 2026-09-01 (decisão do Leonardo: "nenhum plano promete mais esconder
  // este selo") e voltou agora, revisto a pedido de cliente pagante real —
  // quem assina Agência (R$99,90/mês, até 100 bio sites) revende os sites
  // pros clientes DELE e precisa entregar com a marca da própria agência.
  //
  // EXCLUSIVO do plano Agência (ver hasWhiteLabel em subscriptions.ts). O
  // gate que vale de verdade é o do site público (PublicBioSite.tsx), que
  // checa site.ownerPlan — gravado no save pelo servidor, não pelo cliente
  // (ver biositeSync.ts / api/biosite/save). Assim, mesmo que alguém edite
  // este JSON na mão pra ligar o white label num plano menor, o selo do
  // Toqy continua aparecendo.
  //
  // Tudo opcional de propósito: sem configuração nenhuma, o padrão seguro
  // continua sendo o selo do Toqy visível.
  whiteLabel?: {
    hideToqyBadge?: boolean;   // true = esconde o selo "Criado com TOQY"
    brandName?: string;        // Nome da agência/empresa exibido no rodapé
    brandLogoUrl?: string;     // Logo da agência (upload via ImageUploadField)
    brandUrl?: string;         // Link opcional do rodapé pro site da agência
  };
  // Acesso do cliente (2026-09-07, referência Coonexta — documento de
  // análise: "Configurações → Acesso do cliente", presets Só leitura/
  // Operacional/Editor completo). Adaptado ao modelo do Toqy: aqui não
  // existe convite por e-mail nem múltiplos colaboradores — existe UMA
  // chave de edição por site (editKey). Este campo restringe o que
  // QUEM TEM A CHAVE pode fazer; o dono logado (verify-owner) sempre
  // tem acesso total, nunca é afetado por este campo.
  //   "full"        — comportamento de sempre (padrão, sem mudança).
  //   "operational" — a etapa "Aparência" some do editor; o resto
  //                   (Links e Botões, Pix e Wi-Fi, Catálogo) continua
  //                   editável — o cliente mexe no dia a dia, não na
  //                   identidade visual.
  //   "readonly"    — editor abre em modo consulta (todo campo
  //                   desabilitado, botão de salvar não existe).
  clientAccessLevel?: "full" | "operational" | "readonly";
  buttons: ToqyButton[];
  catalog: CatalogItem[];
  editKey: string;
  createdAt: string;
  updatedAt: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  background: string;
  gradientFrom: string;
  gradientTo: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  secondary: string;
  accent: string;
  mode: "dark" | "light";
};

export type SegmentTemplate = {
  segment: Segment;
  templateName: string;
  description: string;
  defaultTheme: ThemePreset;
  modules: ToqySite["modules"];
  buttons: ToqyButton[];
  catalog: CatalogItem[];
  catalogLayout?: CatalogLayout;
};
