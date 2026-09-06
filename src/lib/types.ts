export type ButtonStyle = "full" | "icon";
export type ButtonFill = "solid" | "gradient" | "glass";
export type BackgroundType = "solid" | "gradient" | "image";
export type CatalogLayout = "carousel" | "grid" | "stack" | "grouped" | "category-carousel";

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
    // Cores granulares — opcionais, usam os valores acima como fallback
    colors?: {
      name?: string;           // Cor do nome do negócio
      title?: string;          // Cor do subtítulo/segmento
      location?: string;       // Cor do endereço
      description?: string;    // Cor da descrição
      logoText?: string;       // Cor do texto decorativo/assinatura
      wifiText?: string;       // Cor do texto do Wi-Fi inline
      saveContactText?: string;// Cor do texto do botão Salvar Contato
      callText?: string;       // Cor do texto do botão Ligar
      buttonText?: string;     // Cor do texto dos botões grandes
      buttonBg?: string;       // Cor do fundo dos botões grandes
      buttonBorder?: string;   // Cor da borda dos botões grandes
      catalogTitle?: string;   // Cor do título do catálogo
      catalogItemName?: string;// Cor do nome do item
      catalogItemDesc?: string;// Cor da descrição do item
      catalogItemPrice?: string;// Cor do preço
      catalogItemHighlight?: string; // Cor do badge destaque
      catalogItemBg?: string;  // Cor do card do catálogo
      catalogActionBg?: string;// Cor do botão de ação do catálogo
      catalogActionText?: string; // Cor do texto do botão de ação
    };
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
  // Música própria hospedada no Toqy (2026-09-06, redesenhado de "link de
  // áudio externo" pra upload de verdade — pedido do Leonardo: "hospedar
  // as músicas que ela tem no pc/celular no próprio Toqy"). Limite de
  // ~60s/~4MB (confirmado com o Leonardo) pra nunca estourar o limite real
  // de ~4,5MB por requisição das Vercel Functions.
  musicUrl?: string;
  // Preview de posts do Instagram "em tempo real" — embed oficial da Meta
  // (`instagram.com/embed.js`), sem API key/login: renderiza cada post ao
  // vivo (like/comentário atuais, puxados pelo próprio Instagram), não é
  // captura estática. Autonomia total (2026-09-06, pedido do Leonardo):
  // vários posts (não só 1), com layout e tamanho escolhidos pela pessoa —
  // NÃO puxa automaticamente do perfil (isso exigiria a API oficial do
  // Instagram/Graph API + app registrado no Meta + OAuth por conta
  // Business, decisão consciente de deixar pra um projeto separado depois).
  instagramPosts?: Array<{ id: string; url: string }>;
  // "grid" (2 colunas lado a lado) ficou de fora de propósito — o widget
  // oficial do Instagram não encolhe abaixo de ~326px de largura, então
  // 2 posts lado a lado nunca cabem numa tela de celular (a maioria das
  // visitas). "carousel" (um de cada vez, deslizando) e "list" (empilhado)
  // são os 2 formatos que realmente funcionam em qualquer tamanho de tela.
  instagramLayout?: "carousel" | "list";
  instagramSize?: "sm" | "md" | "lg";
  // Ordem livre das seções do corpo do bio site (2026-09-06, pedido do
  // Leonardo: "o Toqy não pode prender as pessoas a uma coisa só") — cada
  // seção é um BLOCO que a pessoa arrasta pra cima/baixo e intercala como
  // quiser. Título/subtítulo/localização/descrição/assinatura/QR/telefone
  // continuam padronizados (núcleo fixo do bio site, fora desta lista) —
  // só o CORPO (botões grandes, catálogo, música, Instagram) é livre.
  // Undefined = ordem padrão de sempre (compatibilidade com bio sites já
  // criados antes desta feature existir).
  bodyBlockOrder?: Array<"buttons" | "catalog" | "music" | "instagram">;
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
