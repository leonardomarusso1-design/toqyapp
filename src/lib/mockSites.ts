import type { ToqySite } from "./types";
import { createSiteFromSegmentTemplate } from "./segmentTemplates";

export const mockSites: ToqySite[] = [
  createSiteFromSegmentTemplate("barbearia", {
    id: "demo-barbearia",
    slug: "barbearia-andrian",
    status: "active",
    profile: {
      name: "Espa\u00e7o Andrian",
      title: "Barbearia & Est\u00e9tica",
      description: "Barbearia & Est\u00e9tica. Agende seu hor\u00e1rio, acesse o Wi-Fi ou pague no Pix com facilidade.",
      location: "R. Santo Ant\u00f4nio, 170 Centro, Vargem Grande do Sul - SP",
      logoUrl: "/images/logo.jpeg",
      profileImageUrl: "/images/logo.jpeg",
      backgroundImageUrl: "/templates/template-bg-barbearia.png",
      logoSize: "large",
      logoShape: "circle",
    },
    theme: {
      mode: "dark",
      backgroundType: "image",
      background: "#050a12",
      gradientFrom: "#050a12",
      gradientTo: "#152033",
      card: "rgba(15, 23, 42, 0.86)",
      text: "#f8fafc",
      muted: "#cbd5e1",
      primary: "#D4AF37",
      secondary: "#111827",
      accent: "#FACC15",
      buttonFill: "glass",
      buttonStyle: "full",
      buttonRadius: "pill",
      useBackgroundOverlay: true,
    },
    contact: {
      whatsapp: "5519992624655",
      phone: "5519992624655",
      whatsappMessage: "Olá! Vim pelo Toqy da Barbearia Andrian e gostaria de atendimento.",
      instagram: "https://www.instagram.com/barbearia_andrian/",
      email: "",
      website: "",
    },
    links: {
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=R.%20Santo%20Antonio%2C%20170%20Centro%2C%20Vargem%20Grande%20do%20Sul%20-%20SP",
      googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJSX8Wk7cryJQRGRfuYAs48Fo",
      bookingUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D",
      menuUrl: "",
    },
    pix: { enabled: true, key: "26287678801", receiver: "Espa\u00e7o Andrian", bank: "Pix", quickAmounts: [35, 55, 80], allowCustomAmount: true, whatsappProofNumber: "5519992624655" },
    wifi: { enabled: true, ssid: "Barbearia Andrian", password: "recorecobolao", encryption: "WPA" },
    buttons: [
      { id: "barbearia-whatsapp", label: "WhatsApp", type: "whatsapp", enabled: true },
      { id: "barbearia-instagram", label: "Instagram", type: "instagram", enabled: true },
      { id: "barbearia-maps", label: "Como chegar", type: "maps", enabled: true },
      { id: "barbearia-wifi", label: "Wi-Fi: Barbearia Andrian", type: "wifi", enabled: true },
      { id: "barbearia-booking", label: "Agendar hor\u00e1rio", type: "booking", enabled: true },
      { id: "barbearia-review", label: "Avalie no Google", type: "review", enabled: true },
      { id: "barbearia-pix", label: "Chave Pix", type: "pix", enabled: true },
      { id: "barbearia-catalog", label: "Nossos Servi\u00e7os / Cortes", type: "catalog", enabled: true },
    ],
    catalogLayout: "stack",
    catalog: [
      { id: "corte", name: "Corte Masculino", description: "Corte de cabelo impecável e finalizado do seu jeito.", price: "R$ 40,00", imageUrl: "/images/corte_cabelo.jpg", imageLayout: "horizontal", category: "Cortes", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "barba", name: "Barba", description: "Modelagem, acabamento e toalha quente para um visual alinhado.", price: "R$ 35,00", imageUrl: "/images/barba_terapia.jpg", imageLayout: "horizontal", category: "Barba", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "combo", name: "Corte + Barba", description: "Combo completo com corte, barba e finalização premium.", price: "R$ 70,00", imageUrl: "/images/combo_corte_barba.jpg", imageLayout: "horizontal", category: "Combos", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "sobrancelha", name: "Sobrancelha", description: "Aparo e design masculino para valorizar o rosto.", price: "R$ 20,00", imageLayout: "horizontal", category: "Cuidados", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "limpeza", name: "Limpeza de Pele", description: "Cuidado facial para renovar a pele e melhorar o acabamento.", price: "R$ 65,00", imageUrl: "/images/limpeza_pele.jpg", imageLayout: "horizontal", category: "Cuidados", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "escalda", name: "Escalda P\u00e9s", description: "Tratamento relaxante com ervas, óleos essenciais e massagem.", price: "R$ 75,00", imageUrl: "/images/escalda_pes.jpg", imageLayout: "horizontal", category: "Relaxamento", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "capilar", name: "Tratamento Capilar", description: "Tratamento para fortalecer, hidratar e cuidar dos fios.", price: "R$ 60,00", imageUrl: "/images/terapia_capilar.jpg", imageLayout: "horizontal", category: "Cuidados", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "premium", name: "Combo Premium", description: "Corte, barba, sobrancelha e cuidado completo em uma experiência única.", price: "R$ 110,00", imageUrl: "/images/combo_corte_barba.jpg", imageLayout: "horizontal", category: "Combos", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
      { id: "noivo", name: "Dia do Noivo", description: "Preparação completa para um dia especial, com horário reservado.", price: "Sob consulta", imageUrl: "/images/corte_cabelo.jpg", imageLayout: "horizontal", category: "Eventos", enabled: true, actionLabel: "Agendar hor\u00e1rio", actionUrl: "https://booksy.com/pt-br/71848_barbearia-andrian_barbearias_1016795_vargem-grande-do-sul?do=invite&_branch_match_id=1594200252350443894&utm_medium=merchant_customer_invite&_branch_referrer=H4sIAAAAAAAAA8soKSkottLXT07J0UvKz88urtRLzs%2FV9zEyCDd0zwt2NkqyrytKTUstKsrMS49PKsovL04tsnXOKMrPTQUAuP75gDwAAAA%3D" },
    ],
    editKey: "8392-1147",
  }),
];

export function getMockSiteBySlug(slug: string) {
  return mockSites.find((site) => site.slug === slug);
}

export const demoSlugs = mockSites.map((site) => site.slug);

export function getMockSites() { return mockSites; }

// E-mail do dono real dos bio sites de demonstração — só ele vê os mocks no painel
export const MOCK_OWNER_EMAIL = "leonardomarusso1@gmail.com";

export function isDemoSlug(slug: string) {
  return demoSlugs.includes(slug);
}

export function isMockOwner(email?: string | null) {
  return email?.toLowerCase() === MOCK_OWNER_EMAIL.toLowerCase();
}
