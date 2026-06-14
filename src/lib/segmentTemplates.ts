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
function p(name: string, description: string, price = "", actionLabel = "Ver detalhes", imageLayout: CatalogItem["imageLayout"] = "square", imageUrl = ""): CatalogItem {
  return { id: generateId("prd"), name, description, price, actionLabel, actionUrl: "", imageLayout, imageUrl, enabled: true };
}
function modules(buttons: ToqyButton[], extra: Partial<ToqySite["modules"]> = {}) { return syncModulesFromButtons({ ...createShell(), buttons, modules: { ...emptyModules, ...extra } }).modules; }
function createShell(): ToqySite { return {} as ToqySite; }

const barbeariaButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("maps", "Como chegar"), b("wifi", "Wi-Fi"), b("pix", "Pix"), b("booking", "Agendar horário"), b("review", "Avaliar no Google"), b("catalog", "Serviços")];
const restauranteButtons = [b("whatsapp", "WhatsApp"), b("menu", "Cardápio"), b("maps", "Como chegar"), b("pix", "Pix"), b("review", "Avaliar no Google"), b("catalog", "Produtos")];
const salaoButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("booking", "Agendamento"), b("maps", "Como chegar"), b("pix", "Pix"), b("review", "Avaliar no Google"), b("catalog", "Serviços")];
const lojaButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("catalog", "Catálogo"), b("maps", "Como chegar"), b("pix", "Pix"), b("website", "Site")];
const techButtons = [b("whatsapp", "WhatsApp"), b("phone", "Telefone"), b("maps", "Como chegar"), b("instagram", "Instagram"), b("catalog", "Serviços"), b("review", "Avaliar no Google"), b("pix", "Pix")];
const clinicaButtons = [b("whatsapp", "WhatsApp"), b("booking", "Agendamento"), b("maps", "Como chegar"), b("review", "Avaliação Google"), b("catalog", "Serviços")];
const petButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("maps", "Como chegar"), b("pix", "Pix"), b("booking", "Agendar"), b("catalog", "Serviços")];
const servicosButtons = [b("whatsapp", "WhatsApp"), b("instagram", "Instagram"), b("booking", "Agendar"), b("pix", "Pix"), b("catalog", "Serviços")];

export const segmentTemplates: SegmentTemplate[] = [
  { segment: "barbearia", templateName: "Barbearia Premium", description: "Agenda, serviços, Pix, Wi-Fi e avaliações para barbearias.", defaultTheme: t("dark-gold"), buttons: barbeariaButtons, modules: modules(barbeariaButtons), catalog: [p("Corte masculino", "Corte tradicional ou moderno.", "R$ 35", "Agendar", "horizontal", "/images/corte_cabelo.jpg"), p("Barba", "Barba aparada ou desenhada.", "R$ 25", "Agendar", "horizontal", "/images/barba_terapia.jpg"), p("Corte + Barba", "Combo completo com finalização.", "R$ 55", "Agendar", "horizontal", "/images/combo_corte_barba.jpg"), p("Escalda pés", "Experiência de cuidado e relaxamento.", "R$ 35", "Agendar", "horizontal", "/images/escalda_pes.jpg"), p("Terapia capilar", "Tratamento e cuidado para cabelo.", "R$ 70", "Agendar", "horizontal", "/images/terapia_capilar.jpg")] },
  { segment: "restaurante", templateName: "Restaurante e Delivery", description: "Cardápio, delivery, localização, Pix e avaliações.", defaultTheme: t("food-red"), buttons: restauranteButtons, modules: modules(restauranteButtons), catalog: [p("Prato principal", "Destaque da casa.", "R$ 45", "Pedir", "horizontal"), p("Bebida", "Sucos, refrigerantes e especiais.", "R$ 8", "Pedir"), p("Combo", "Prato, bebida e acompanhamento.", "R$ 59", "Pedir", "horizontal"), p("Sobremesa", "Finalize com um doce da casa.", "R$ 15", "Pedir")] },
  { segment: "pastelaria", templateName: "Pastelaria", description: "Cardápio, Pix, pedidos pelo WhatsApp e rota até a loja.", defaultTheme: t("food-red"), buttons: restauranteButtons, modules: modules(restauranteButtons), catalog: [p("Pastel de carne", "Massa crocante e recheio caprichado.", "R$ 12", "Pedir"), p("Pastel de queijo", "Queijo derretido e massa sequinha.", "R$ 12", "Pedir"), p("Pastel especial", "Recheio da casa.", "R$ 18", "Pedir", "horizontal"), p("Combo família", "Pastéis + bebidas.", "R$ 49", "Pedir", "horizontal")] },
  { segment: "salao", templateName: "Salão de Beleza", description: "Agendamento, portfólio, serviços e avaliação para salões.", defaultTheme: t("beauty-rose"), buttons: salaoButtons, modules: modules(salaoButtons), catalog: [p("Escova", "Finalização modelada.", "R$ 80", "Agendar"), p("Manicure", "Esmaltação tradicional ou gel.", "R$ 30", "Agendar"), p("Progressiva", "Tratamento com efeito liso.", "R$ 180", "Agendar", "horizontal"), p("Sobrancelha", "Design e alinhamento.", "R$ 35", "Agendar")] },
  { segment: "loja", templateName: "Loja e Vitrine", description: "Catálogo, atendimento, redes sociais e pagamento.", defaultTheme: t("minimal-white"), buttons: lojaButtons, modules: modules(lojaButtons), catalog: [p("Produto destaque", "Mais vendido da semana.", "R$ 99", "Comprar"), p("Promoção", "Oferta especial por tempo limitado.", "R$ 49", "Comprar"), p("Novidades", "Lançamentos e novas coleções.", "A partir de R$ 59", "Ver", "horizontal")] },
  { segment: "assistencia_tecnica", templateName: "Assistência Técnica", description: "Serviços, orçamento rápido e contato para assistência.", defaultTheme: t("blue-tech"), buttons: techButtons, modules: modules(techButtons), catalog: [p("Troca de tela", "Orçamento rápido para troca de tela.", "Consulte", "Orçar"), p("Troca de bateria", "Diagnóstico e substituição.", "Consulte", "Orçar"), p("Película", "Aplicação de película.", "A partir de R$ 25", "Comprar"), p("Diagnóstico técnico", "Avaliação do aparelho.", "Consulte", "Chamar", "horizontal")] },
  { segment: "clinica", templateName: "Clínica Profissional", description: "Contato, agendamento, serviços e localização.", defaultTheme: t("clinic-blue"), buttons: clinicaButtons, modules: modules(clinicaButtons), catalog: [p("Consulta", "Atendimento com hora marcada.", "Consulte", "Agendar"), p("Avaliação", "Primeiro atendimento ou triagem.", "Consulte", "Agendar"), p("Procedimento", "Serviços e procedimentos.", "Consulte", "Agendar", "horizontal")] },
  { segment: "petshop", templateName: "Pet Shop", description: "Banho, tosa, produtos, agenda e contato rápido.", defaultTheme: t("pet-fun"), buttons: petButtons, modules: modules(petButtons), catalog: [p("Banho", "Banho completo e perfumado.", "R$ 45", "Agendar"), p("Tosa", "Tosa na tesoura ou máquina.", "R$ 60", "Agendar"), p("Produtos", "Ração, brinquedos e acessórios.", "A partir de R$ 15", "Ver")] },
  { segment: "servicos", templateName: "Prestador de Serviço", description: "Portfólio simples, atendimento e agenda.", defaultTheme: t("blue-tech"), buttons: servicosButtons, modules: modules(servicosButtons), catalog: [p("Serviço principal", "Descrição do principal serviço.", "R$ 150", "Chamar"), p("Pacote básico", "Entrega essencial para começar.", "R$ 200", "Chamar"), p("Pacote premium", "Solução completa com suporte.", "R$ 400", "Chamar", "horizontal")] },
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
    theme: { mode: preset.mode, backgroundType: "gradient", background: preset.background, gradientFrom: preset.gradientFrom, gradientTo: preset.gradientTo, card: preset.card, text: preset.text, muted: preset.muted, primary: preset.primary, secondary: preset.secondary, accent: preset.accent, buttonFill: "solid", buttonStyle: "full", buttonRadius: "pill", useBackgroundOverlay: true, ...overrides.theme },
    plaqueTheme: { useSameBackground: false, backgroundStyle: "image", backgroundImageUrl: "", ...overrides.plaqueTheme },
    contact: { phone: "", whatsapp: "", whatsappMessage: "Olá! Vim pelo QR Code e gostaria de mais informações.", instagram: "", facebook: "", email: "", website: "", ...overrides.contact },
    links: { googleMapsUrl: "", googleReviewUrl: "", bookingUrl: "", menuUrl: "", ...overrides.links },
    pix: { enabled: template.modules.pix, key: "", receiver: "", bank: "", quickAmounts: [10, 20, 50], allowCustomAmount: true, whatsappProofNumber: "", ...overrides.pix },
    wifi: { enabled: template.modules.wifi, ssid: "", password: "", encryption: "WPA", ...overrides.wifi },
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
    modules: { ...template.modules },
    updatedAt: new Date().toISOString(),
  });
}
