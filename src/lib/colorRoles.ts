import type { ColorRole, ColorValue } from "./types";

// Sistema de cores unificado (2026-09-06) — ver o comentário grande em
// types.ts (campo `colors` dentro de `theme`) para o histórico completo
// do problema que isso resolve (2 sistemas de cor coexistindo, "muitos
// lugares repetidos" reportado pelo Leonardo).

// Metadados de cada role — usado tanto pra gerar a lista de campos no
// editor (SiteBuilder) quanto como documentação central de onde cada
// role aparece no biosite público.
export const COLOR_ROLES: Record<ColorRole, { label: string; hint: string; kind: "text" | "bg"; group: string }> = {
  pageBackground: { label: "Fundo da página", hint: "Cor de fundo geral do biosite", kind: "bg", group: "Fundo" },
  name: { label: "Nome do negócio", hint: "Título principal", kind: "text", group: "Perfil" },
  title: { label: "Subtítulo/segmento", hint: "Ex: Dentista, Barbearia", kind: "text", group: "Perfil" },
  location: { label: "Endereço/localização", hint: "Linha do endereço", kind: "text", group: "Perfil" },
  description: { label: "Descrição", hint: "Texto de apresentação", kind: "text", group: "Perfil" },
  logoText: { label: "Texto decorativo/assinatura", hint: "Texto abaixo da logo", kind: "text", group: "Perfil" },
  buttonBg: { label: "Fundo dos botões", hint: "Botões grandes (links)", kind: "bg", group: "Botões" },
  buttonText: { label: "Texto dos botões", hint: "Cor do texto/ícone", kind: "text", group: "Botões" },
  buttonBorder: { label: "Borda dos botões", hint: "Cor da borda", kind: "bg", group: "Botões" },
  socialIconBg: { label: "Fundo dos ícones sociais", hint: "Círculo por trás do ícone (ative \"translúcido\" abaixo pra suavizar)", kind: "bg", group: "Ícones sociais" },
  saveContactText: { label: "Texto — Salvar Contato", hint: "Cor do texto do botão", kind: "text", group: "Contato rápido" },
  callText: { label: "Texto — Ligar", hint: "Cor do texto do botão", kind: "text", group: "Contato rápido" },
  wifiText: { label: "Texto — Wi-Fi inline", hint: "Cor do texto de rede/senha", kind: "text", group: "Contato rápido" },
  catalogSectionLabel: { label: "Rótulo da seção", hint: "Ex: \"Catálogo\", \"Destaques\"", kind: "text", group: "Catálogo" },
  catalogTitle: { label: "Título do catálogo", hint: "Ex: Nossos Serviços", kind: "text", group: "Catálogo" },
  catalogItemBg: { label: "Fundo dos cards", hint: "Cor de fundo de cada card", kind: "bg", group: "Catálogo" },
  catalogItemName: { label: "Nome do item", hint: "Título do serviço/produto", kind: "text", group: "Catálogo" },
  catalogItemDesc: { label: "Descrição do item", hint: "Texto descritivo", kind: "text", group: "Catálogo" },
  catalogItemPrice: { label: "Preço", hint: "Valor em R$", kind: "text", group: "Catálogo" },
  catalogItemHighlight: { label: "Badge/Destaque", hint: "Cor do rótulo especial", kind: "text", group: "Catálogo" },
  catalogActionBg: { label: "Fundo botão de ação", hint: "Ex: Ver, Agendar", kind: "bg", group: "Catálogo" },
  catalogActionText: { label: "Texto botão de ação", hint: "Cor do texto", kind: "text", group: "Catálogo" },
  modalIconBg: { label: "Ícone de modais/pills", hint: "QR Code, Compartilhar, Pix, Wi-Fi", kind: "bg", group: "Diversos" },
  footerCreditText: { label: "Link de rodapé", hint: "Crédito \"toqy.com.br\"", kind: "text", group: "Diversos" },
};

function normalize(val: ColorValue | string | undefined): ColorValue | undefined {
  if (val === undefined) return undefined;
  return typeof val === "string" ? { mode: "solid", value: val } : val;
}

// Extrai só a cor sólida representativa de um ColorValue — usado onde
// precisamos de UM hex (ex: como base pra calcular contraste, ou compor
// um `${cor}33` com alpha) mesmo que o valor real seja um gradiente
// (nesse caso, usa o "from" como aproximação razoável).
export function colorSwatch(val: ColorValue | string | undefined, fallbackHex: string): string {
  const normalized = normalize(val);
  if (!normalized) return fallbackHex;
  return normalized.mode === "solid" ? normalized.value : normalized.from;
}

// Resolve um role pra CSSProperties prontas pra usar em `style={}`.
// kind="bg": sólido vira `background`; gradiente vira `backgroundImage`.
// kind="text": sólido vira `color`; gradiente usa o mesmo truque de
// .gradient-text do globals.css (texto com bg-clip).
export function resolveColorStyle(val: ColorValue | string | undefined, kind: "text" | "bg", fallbackHex: string): React.CSSProperties {
  const normalized = normalize(val) ?? { mode: "solid" as const, value: fallbackHex };
  if (normalized.mode === "solid") {
    return kind === "text" ? { color: normalized.value } : { background: normalized.value };
  }
  const gradient = `linear-gradient(135deg, ${normalized.from}, ${normalized.to})`;
  if (kind === "bg") return { backgroundImage: gradient };
  return {
    backgroundImage: gradient,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  } as React.CSSProperties;
}
