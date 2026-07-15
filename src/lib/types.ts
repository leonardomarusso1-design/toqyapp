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
  imageLayout: "square" | "horizontal";
  category?: string;
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
