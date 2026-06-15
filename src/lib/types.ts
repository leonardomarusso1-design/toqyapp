export type ButtonStyle = "full" | "icon";
export type ButtonFill = "solid" | "gradient" | "glass";
export type BackgroundType = "solid" | "gradient" | "image";
export type CatalogLayout = "carousel" | "grid" | "stack" | "grouped";

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
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price?: string;
  imageUrl?: string;
  imageLayout: "square" | "horizontal";
  category?: string;
  enabled: boolean;
  actionLabel?: string;
  actionUrl?: string;
};

export type ToqySite = {
  id: string;
  slug: string;
  segment: Segment;
  status: "active" | "draft" | "disabled";
  profile: {
    name: string;
    title?: string;
    description: string;
    location: string;
    profileImageUrl?: string;
    logoUrl?: string;
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
    useBackgroundOverlay: boolean;
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
  };
  catalogLayout: CatalogLayout;
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
