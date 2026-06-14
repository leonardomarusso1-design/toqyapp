import type { ToqySite } from "./types";
import { createSiteFromSegmentTemplate } from "./segmentTemplates";

export const mockSites: ToqySite[] = [
  createSiteFromSegmentTemplate("barbearia", {
    id: "demo-barbearia",
    slug: "barbearia-andrian",
    status: "active",
    profile: {
      name: "Espaço Andrian",
      title: "Barbearia premium",
      description: "Cortes, barba, cuidados masculinos e atendimento com hora marcada.",
      location: "Indaiatuba, SP",
      logoUrl: "/images/logo.jpeg",
      profileImageUrl: "/images/logo.jpeg",
      backgroundImageUrl: "",
      logoSize: "large",
      logoShape: "circle",
    },
    contact: {
      whatsapp: "5511999999999",
      phone: "5511999999999",
      whatsappMessage: "Olá! Vim pelo Toqy e gostaria de agendar um horário.",
      instagram: "https://instagram.com/barbeariaandrian",
      email: "",
      website: "",
    },
    links: {
      googleMapsUrl: "https://maps.google.com",
      googleReviewUrl: "https://google.com",
      bookingUrl: "https://barbeariaandrian.booksy.com",
      menuUrl: "",
    },
    pix: { enabled: true, key: "11999999999", receiver: "Espaço Andrian", bank: "Pix", quickAmounts: [35, 55, 80], allowCustomAmount: true, whatsappProofNumber: "5511999999999" },
    wifi: { enabled: true, ssid: "Barbearia Andrian", password: "recorecobolao", encryption: "WPA" },
    editKey: "8392-1147",
  }),
  createSiteFromSegmentTemplate("pastelaria", {
    id: "demo-pastel",
    slug: "pastel-da-praca",
    status: "active",
    profile: { name: "Pastel da Praça", title: "Pastelaria e lanches", description: "Pastéis crocantes, combos e atendimento rápido pelo WhatsApp.", location: "Centro, Indaiatuba", logoSize: "medium", logoShape: "rounded" },
    contact: { whatsapp: "5511988888888", phone: "5511988888888", whatsappMessage: "Olá! Quero fazer um pedido pelo Toqy.", instagram: "https://instagram.com/pasteldapraca" },
    links: { googleMapsUrl: "https://maps.google.com", googleReviewUrl: "https://google.com", menuUrl: "https://example.com/cardapio" },
    pix: { enabled: true, key: "pix@pasteldapraca.com", receiver: "Pastel da Praça", quickAmounts: [12, 24, 49], allowCustomAmount: true, whatsappProofNumber: "5511988888888" },
    editKey: "2222-3333",
  }),
  createSiteFromSegmentTemplate("assistencia_tecnica", {
    id: "demo-mycell",
    slug: "my-cell",
    status: "active",
    profile: { name: "M.Y Cell", title: "Assistência técnica", description: "Conserto de celulares, acessórios, películas e diagnósticos rápidos.", location: "Indaiatuba, SP", logoSize: "medium", logoShape: "rounded" },
    contact: { whatsapp: "5511977777777", phone: "5511977777777", whatsappMessage: "Olá! Quero orçamento pelo Toqy.", instagram: "https://instagram.com/mycell" },
    links: { googleMapsUrl: "https://maps.google.com", googleReviewUrl: "https://google.com" },
    pix: { enabled: true, key: "11977777777", receiver: "M.Y Cell", quickAmounts: [25, 50, 100], allowCustomAmount: true, whatsappProofNumber: "5511977777777" },
    editKey: "4444-5555",
  }),
  createSiteFromSegmentTemplate("salao", { id: "demo-salao", slug: "salao-demo", status: "active", profile: { name: "Studio Bella", title: "Salão de beleza", description: "Beleza, cuidados e agendamentos em uma página simples.", location: "Indaiatuba, SP", logoSize: "medium", logoShape: "circle" }, editKey: "6666-7777" }),
  createSiteFromSegmentTemplate("clinica", { id: "demo-clinica", slug: "clinica-demo", status: "active", profile: { name: "Clínica Vida", title: "Saúde e bem-estar", description: "Agendamentos, localização e serviços em uma página profissional.", location: "Indaiatuba, SP", logoSize: "medium", logoShape: "rounded" }, editKey: "8888-9999" }),
  createSiteFromSegmentTemplate("loja", { id: "demo-loja", slug: "loja-demo", status: "active", profile: { name: "Loja Demo", title: "Vitrine digital", description: "Produtos, atendimento e pagamento em poucos toques.", location: "Indaiatuba, SP", logoSize: "medium", logoShape: "rounded" }, editKey: "1111-2222" }),
];

export function getMockSiteBySlug(slug: string) {
  return mockSites.find((site) => site.slug === slug);
}
