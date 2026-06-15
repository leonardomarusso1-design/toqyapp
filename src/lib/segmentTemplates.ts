import type { CatalogItem, Segment, SegmentTemplate, ThemePreset, ToqyButton, ToqySite } from "./types";
import { getThemePresetById } from "./themePresets";
import { generateEditKey, generateId, generateSlug } from "./security";
import { syncModulesFromButtons } from "./buttonSync";

export const segmentOptions: Array<{ value: Segment; label: string }> = [
  { value: "barbearia", label: "Barbearia" },
  { value: "salao", label: "Salão de beleza" },
  { value: "restaurante", label: "Restaurante" },
  { value: "pastelaria", label: "Pastelaria" },
  { value: "lanchonete", label: "Lanchonete" },
  { value: "loja", label: "Loja" },
  { value: "assistencia_tecnica", label: "Assistência técnica" },
  { value: "clinica", label: "Clínica" },
  { value: "petshop", label: "Pet shop" },
  { value: "oficina", label: "Oficina" },
  { value: "delivery", label: "Delivery" },
  { value: "servicos", label: "Prestador de serviço" },
  { value: "fotografo", label: "Fotógrafo" },
  { value: "dentista", label: "Dentista" },
  { value: "outro", label: "Outro" },
];

const emptyModules: ToqySite["modules"] = {
  saveContact: true,
  whatsapp: false,
  instagram: false,
  phone: false,
  maps: false,
  wifi: false,
  pix: false,
  pixHub: false,
  googleReview: false,
  booking: false,
  catalog: false,
};

function t(id: string): ThemePreset { return getThemePresetById(id); }
function b(type: ToqyButton["type"], label: string, url = ""): ToqyButton { return { id: generateId("btn"), type, label, url, enabled: true }; }
function p(name: string, description: string, price = "", actionLabel = "Ver detalhes", imageLayout: CatalogItem["imageLayout"] = "square", imageUrl = "", category = "Destaques"): CatalogItem {
  return { id: generateId("prd"), name, description, price, actionLabel, actionUrl: "", imageLayout, imageUrl, category, enabled: true };
}
function modules(buttons: ToqyButton[], extra: Partial<ToqySite["modules"]> = {}) { return syncModulesFromButtons({ ...({} as ToqySite), buttons, modules: { ...emptyModules, ...extra } }).modules; }

const barbeariaButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("maps", "Como chegar"), b("wifi", "Wi-Fi"), b("pix", "Pix"), b("booking", "Agendar horário"), b("review", "Avaliar no Google"), b("catalog", "Serviços")];
const restauranteButtons = [b("whatsapp", "WhatsApp"), b("menu", "Cardápio"), b("maps", "Como chegar"), b("pix", "Pix"), b("review", "Avaliar no Google"), b("catalog", "Produtos")];
const salaoButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("booking", "Agendamento"), b("maps", "Como chegar"), b("pix", "Pix"), b("review", "Avaliar no Google"), b("catalog", "Serviços")];
const lojaButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("catalog", "Catálogo"), b("maps", "Como chegar"), b("pix", "Pix"), b("website", "Site")];
const techButtons = [b("whatsapp", "WhatsApp"), b("phone", "Telefone"), b("maps", "Como chegar"), b("instagram", "Instagram"), b("catalog", "Serviços"), b("review", "Avaliar no Google"), b("pix", "Pix")];
const clinicaButtons = [b("whatsapp", "WhatsApp"), b("booking", "Agendamento"), b("maps", "Como chegar"), b("review", "Avaliação Google"), b("catalog", "Serviços")];
const petButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("maps", "Como chegar"), b("pix", "Pix"), b("booking", "Agendar"), b("catalog", "Serviços")];
const servicosButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("booking", "Agendar"), b("pix", "Pix"), b("catalog", "Serviços")];

export const segmentTemplates: SegmentTemplate[] = [
  {
    segment: "barbearia",
    templateName: "Barbearia Premium",
    description: "Agenda, serviços, Pix, Wi-Fi e avaliações para barbearias.",
    defaultTheme: t("dark-gold"),
    buttons: barbeariaButtons,
    modules: modules(barbeariaButtons),
    catalogLayout: "grouped",
    catalog: [
      p("Corte social clássico", "Corte alinhado para trabalho, eventos e rotina.", "R$ 40", "Agendar", "horizontal", "/images/corte_cabelo.jpg", "Cortes social"),
      p("Corte social premium", "Acabamento na navalha e finalização modelada.", "R$ 55", "Agendar", "horizontal", "/images/combo_corte_barba.jpg", "Cortes social"),
      p("Degradê baixo", "Degradê limpo e natural com acabamento preciso.", "R$ 45", "Agendar", "horizontal", "/images/corte_cabelo.jpg", "Cortes degradê"),
      p("Degradê navalhado", "Visual marcante com transição bem definida.", "R$ 55", "Agendar", "horizontal", "/images/combo_corte_barba.jpg", "Cortes degradê"),
      p("Barboterapia", "Toalha quente, espuma, alinhamento e relaxamento.", "R$ 60", "Agendar", "horizontal", "/images/barba_terapia.jpg", "Barba e cuidados"),
      p("Escalda pés", "Experiência relaxante com óleos e massagem.", "R$ 75", "Agendar", "horizontal", "/images/escalda_pes.jpg", "Barba e cuidados"),
      p("Terapia capilar", "Tratamento para couro cabeludo e fios.", "R$ 90", "Agendar", "horizontal", "/images/terapia_capilar.jpg", "Tratamentos"),
      p("Limpeza de pele", "Limpeza profunda e hidratação facial.", "R$ 120", "Agendar", "horizontal", "/images/limpeza_pele.jpg", "Tratamentos"),
    ],
  },
  {
    segment: "restaurante",
    templateName: "Restaurante e Delivery",
    description: "Cardápio, delivery, localização, Pix e avaliações.",
    defaultTheme: t("food-red"),
    buttons: restauranteButtons,
    modules: modules(restauranteButtons),
    catalogLayout: "carousel",
    catalog: [
      p("Prato da casa", "Receita destaque com preparo especial.", "R$ 45", "Pedir", "horizontal", "/templates/catalog/food-combo.svg", "Pratos"),
      p("Combo executivo", "Prato, bebida e acompanhamento.", "R$ 59", "Pedir", "horizontal", "/templates/catalog/food-combo.svg", "Combos"),
      p("Bebida gelada", "Sucos, refrigerantes e especiais.", "R$ 8", "Pedir", "square", "/templates/catalog/food-bebida.svg", "Bebidas"),
      p("Sobremesa", "Doce da casa para finalizar.", "R$ 15", "Pedir", "square", "/templates/catalog/food-pastel.svg", "Sobremesas"),
    ],
  },
  {
    segment: "pastelaria",
    templateName: "Pastelaria Vibrante",
    description: "Cardápio, Pix, pedidos pelo WhatsApp e rota até a loja.",
    defaultTheme: t("food-red"),
    buttons: restauranteButtons,
    modules: modules(restauranteButtons),
    catalogLayout: "grouped",
    catalog: [
      p("Pastel de carne", "Massa crocante e recheio caprichado.", "R$ 12", "Pedir", "horizontal", "/templates/catalog/food-pastel.svg", "Pastéis tradicionais"),
      p("Pastel de queijo", "Queijo derretido e massa sequinha.", "R$ 12", "Pedir", "horizontal", "/templates/catalog/food-pastel.svg", "Pastéis tradicionais"),
      p("Pastel especial da casa", "Recheio especial com ingredientes selecionados.", "R$ 18", "Pedir", "horizontal", "/templates/catalog/food-combo.svg", "Especiais"),
      p("Combo família", "Pastéis + bebidas para dividir.", "R$ 49", "Pedir", "horizontal", "/templates/catalog/food-combo.svg", "Combos"),
      p("Refrigerante", "Lata, garrafa e opções geladas.", "R$ 7", "Pedir", "square", "/templates/catalog/food-bebida.svg", "Bebidas"),
    ],
  },
  {
    segment: "salao",
    templateName: "Salão Sofisticado",
    description: "Agendamento, portfólio, serviços e avaliação para salões.",
    defaultTheme: t("beauty-rose"),
    buttons: salaoButtons,
    modules: modules(salaoButtons),
    catalogLayout: "carousel",
    catalog: [
      p("Escova modelada", "Finalização com brilho e movimento.", "R$ 80", "Agendar", "horizontal", "/templates/catalog/beauty-hair.svg", "Cabelo"),
      p("Progressiva", "Tratamento com efeito liso e acabamento premium.", "R$ 180", "Agendar", "horizontal", "/templates/catalog/beauty-hair.svg", "Cabelo"),
      p("Manicure", "Esmaltação tradicional ou em gel.", "R$ 35", "Agendar", "square", "/templates/catalog/beauty-nails.svg", "Unhas"),
      p("Design de sobrancelha", "Alinhamento e desenho personalizado.", "R$ 45", "Agendar", "square", "/templates/catalog/beauty-hair.svg", "Estética"),
    ],
  },
  {
    segment: "loja",
    templateName: "Loja e Vitrine",
    description: "Catálogo, atendimento, redes sociais e pagamento.",
    defaultTheme: t("minimal-white"),
    buttons: lojaButtons,
    modules: modules(lojaButtons),
    catalogLayout: "grid",
    catalog: [
      p("Produto destaque", "Mais vendido da semana.", "R$ 99", "Comprar", "square", "/templates/catalog/loja-vitrine.svg", "Destaques"),
      p("Promoção relâmpago", "Oferta especial por tempo limitado.", "R$ 49", "Comprar", "square", "/templates/catalog/loja-promo.svg", "Promoções"),
      p("Novidades", "Lançamentos e novas coleções.", "A partir de R$ 59", "Ver", "horizontal", "/templates/catalog/loja-vitrine.svg", "Novidades"),
      p("Kit presente", "Combo pronto para presentear.", "R$ 129", "Comprar", "square", "/templates/catalog/loja-promo.svg", "Kits"),
    ],
  },
  {
    segment: "assistencia_tecnica",
    templateName: "Assistência Técnica Tech",
    description: "Serviços, orçamento rápido e contato para assistência.",
    defaultTheme: t("blue-tech"),
    buttons: techButtons,
    modules: modules(techButtons),
    catalogLayout: "grid",
    catalog: [
      p("Troca de tela", "Orçamento rápido para troca de tela.", "Consulte", "Orçar", "square", "/templates/catalog/tech-screen.svg", "Manutenção"),
      p("Troca de bateria", "Diagnóstico e substituição.", "Consulte", "Orçar", "square", "/templates/catalog/tech-phone.svg", "Manutenção"),
      p("Película 3D", "Aplicação de película com acabamento premium.", "A partir de R$ 25", "Comprar", "square", "/templates/catalog/tech-phone.svg", "Acessórios"),
      p("Diagnóstico técnico", "Avaliação completa do aparelho.", "Consulte", "Chamar", "horizontal", "/templates/catalog/tech-screen.svg", "Orçamentos"),
    ],
  },
  {
    segment: "clinica",
    templateName: "Clínica Profissional",
    description: "Contato, agendamento, serviços e localização.",
    defaultTheme: t("clinic-blue"),
    buttons: clinicaButtons,
    modules: modules(clinicaButtons),
    catalogLayout: "stack",
    catalog: [
      p("Consulta", "Atendimento com hora marcada.", "Consulte", "Agendar", "horizontal", "/templates/catalog/clinic-consulta.svg", "Atendimentos"),
      p("Avaliação", "Primeiro atendimento ou triagem.", "Consulte", "Agendar", "horizontal", "/templates/catalog/clinic-consulta.svg", "Atendimentos"),
      p("Procedimento", "Serviços e procedimentos especializados.", "Consulte", "Agendar", "horizontal", "/templates/catalog/clinic-procedimento.svg", "Procedimentos"),
    ],
  },
  {
    segment: "petshop",
    templateName: "Pet Shop Amigável",
    description: "Banho, tosa, produtos, agenda e contato rápido.",
    defaultTheme: t("pet-fun"),
    buttons: petButtons,
    modules: modules(petButtons),
    catalogLayout: "carousel",
    catalog: [
      p("Banho", "Banho completo e perfumado.", "R$ 45", "Agendar", "square", "/templates/catalog/pet-banho.svg", "Serviços"),
      p("Tosa", "Tosa na tesoura ou máquina.", "R$ 60", "Agendar", "square", "/templates/catalog/pet-banho.svg", "Serviços"),
      p("Rações e acessórios", "Produtos para o dia a dia do seu pet.", "A partir de R$ 15", "Ver", "horizontal", "/templates/catalog/pet-produto.svg", "Produtos"),
    ],
  },
  {
    segment: "servicos",
    templateName: "Prestador de Serviço",
    description: "Portfólio simples, atendimento e agenda.",
    defaultTheme: t("blue-tech"),
    buttons: servicosButtons,
    modules: modules(servicosButtons),
    catalogLayout: "stack",
    catalog: [
      p("Serviço principal", "Descrição do principal serviço.", "R$ 150", "Chamar", "horizontal", "/templates/catalog/servicos-premium.svg", "Serviços"),
      p("Pacote básico", "Entrega essencial para começar.", "R$ 200", "Chamar", "horizontal", "/templates/catalog/servicos-premium.svg", "Pacotes"),
      p("Pacote premium", "Solução completa com suporte.", "R$ 400", "Chamar", "horizontal", "/templates/catalog/servicos-premium.svg", "Pacotes"),
    ],
  },
];

const fallbackTemplate = segmentTemplates.find((item) => item.segment === "servicos")!;
export function getSegmentTemplate(segment: Segment): SegmentTemplate { return segmentTemplates.find((template) => template.segment === segment) ?? fallbackTemplate; }

export function createSiteFromSegmentTemplate(segment: Segment, overrides: Partial<ToqySite> = {}): ToqySite {
  const template = getSegmentTemplate(segment);
  const preset = template.defaultTheme;
  const now = new Date().toISOString();
  const profileOverrides: Partial<ToqySite["profile"]> = overrides.profile ?? {};
  const name = profileOverrides.name ?? "Novo negócio";
  const slug = overrides.slug ?? generateSlug(name);
  const site: ToqySite = {
    id: overrides.id ?? generateId("site"),
    slug,
    segment,
    status: overrides.status ?? "draft",
    profile: {
      name,
      title: profileOverrides.title ?? template.templateName,
      description: profileOverrides.description ?? template.description,
      location: profileOverrides.location ?? "Endereço do negócio",
      logoSize: profileOverrides.logoSize ?? "medium",
      logoShape: profileOverrides.logoShape ?? "circle",
      profileImageUrl: profileOverrides.profileImageUrl ?? "",
      logoUrl: profileOverrides.logoUrl ?? "",
      backgroundImageUrl: profileOverrides.backgroundImageUrl ?? "",
    },
    themePresetId: overrides.themePresetId ?? preset.id,
    theme: { mode: preset.mode, backgroundType: "gradient", background: preset.background, gradientFrom: preset.gradientFrom, gradientTo: preset.gradientTo, card: preset.card, text: preset.text, muted: preset.muted, primary: preset.primary, secondary: preset.secondary, accent: preset.accent, buttonFill: "glass", buttonStyle: "full", buttonRadius: "pill", useBackgroundOverlay: true, ...overrides.theme },
    plaqueTheme: { useSameBackground: false, backgroundStyle: "image", backgroundImageUrl: "", ...overrides.plaqueTheme },
    contact: { phone: "", whatsapp: "", whatsappMessage: "Olá! Vim pelo QR Code e gostaria de mais informações.", instagram: "", facebook: "", email: "", website: "", ...overrides.contact },
    links: { googleMapsUrl: "", googleReviewUrl: "", bookingUrl: "", menuUrl: "", ...overrides.links },
    pix: { enabled: template.modules.pix, key: "", receiver: "", bank: "", quickAmounts: [10, 20, 50], allowCustomAmount: true, whatsappProofNumber: "", ...overrides.pix },
    wifi: { enabled: template.modules.wifi, ssid: "", password: "", encryption: "WPA", checkinUrl: "", checkinLabel: "Fazer check-in", ...overrides.wifi },
    catalogLayout: overrides.catalogLayout ?? template.catalogLayout ?? "carousel",
    modules: { ...template.modules, ...overrides.modules },
    buttons: overrides.buttons ? [...overrides.buttons] : template.buttons.map((item) => ({ ...item, id: generateId("btn") })),
    catalog: overrides.catalog ? [...overrides.catalog] : template.catalog.map((item) => ({ ...item, id: generateId("prd") })),
    editKey: overrides.editKey ?? generateEditKey(),
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
  return syncModulesFromButtons(site);
}

export function applySegmentTemplate(site: ToqySite, segment: Segment): ToqySite {
  const template = getSegmentTemplate(segment);
  const preset = template.defaultTheme;
  return syncModulesFromButtons({
    ...site,
    segment,
    profile: { ...site.profile, title: template.templateName, description: site.profile.description || template.description },
    themePresetId: preset.id,
    theme: { ...site.theme, mode: preset.mode, background: preset.background, gradientFrom: preset.gradientFrom, gradientTo: preset.gradientTo, card: preset.card, text: preset.text, muted: preset.muted, primary: preset.primary, secondary: preset.secondary, accent: preset.accent },
    buttons: template.buttons.map((item) => ({ ...item, id: generateId("btn") })),
    catalog: template.catalog.map((item) => ({ ...item, id: generateId("prd") })),
    catalogLayout: template.catalogLayout ?? site.catalogLayout ?? "carousel",
    modules: { ...template.modules },
    updatedAt: new Date().toISOString(),
  });
}
