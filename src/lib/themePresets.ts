import type { ThemePreset } from "./types";

export const themePresets: ThemePreset[] = [
  { id: "toqy-dark", name: "TOQY Dark", description: "Navy escuro com teal/cyan premium.", mode: "dark", background: "#020617", gradientFrom: "#020617", gradientTo: "#0F172A", card: "rgba(15,23,42,0.78)", text: "#FFFFFF", muted: "#94A3B8", primary: "#14B8A6", secondary: "#06B6D4", accent: "#8B5CF6" },
  { id: "dark-gold", name: "Dark Gold", description: "Luxo escuro para barbearias e serviços premium.", mode: "dark", background: "#070B14", gradientFrom: "#05070D", gradientTo: "#15120A", card: "rgba(16,20,32,0.82)", text: "#F8FAFC", muted: "#B6B8C4", primary: "#C0B283", secondary: "#F5D76E", accent: "#EAB308" },
  { id: "blue-tech", name: "Blue Tech", description: "Tecnologia e assistência técnica.", mode: "dark", background: "#07111F", gradientFrom: "#07111F", gradientTo: "#0B3B5A", card: "rgba(13,27,42,0.82)", text: "#E5F4FF", muted: "#9DB4C8", primary: "#22D3EE", secondary: "#3B82F6", accent: "#67E8F9" },
  { id: "food-red", name: "Food Red", description: "Restaurantes, lanchonetes e pastelarias.", mode: "dark", background: "#1A0707", gradientFrom: "#1A0707", gradientTo: "#7F1D1D", card: "rgba(69,10,10,0.78)", text: "#FFF7ED", muted: "#FED7AA", primary: "#F97316", secondary: "#EF4444", accent: "#FACC15" },
  { id: "beauty-rose", name: "Beauty Rose", description: "Salões, estética e beleza.", mode: "dark", background: "#190A16", gradientFrom: "#190A16", gradientTo: "#831843", card: "rgba(80,7,36,0.78)", text: "#FFF1F2", muted: "#FBCFE8", primary: "#F472B6", secondary: "#FB7185", accent: "#F9A8D4" },
  { id: "clinic-blue", name: "Clinic Blue", description: "Clínicas, saúde e consultórios.", mode: "light", background: "#EFF6FF", gradientFrom: "#EFF6FF", gradientTo: "#DBEAFE", card: "rgba(255,255,255,0.92)", text: "#0F172A", muted: "#475569", primary: "#2563EB", secondary: "#0EA5E9", accent: "#14B8A6" },
  { id: "pet-fun", name: "Pet Fun", description: "Pet shops e serviços para pets.", mode: "light", background: "#F0FDF4", gradientFrom: "#F0FDF4", gradientTo: "#DCFCE7", card: "rgba(255,255,255,0.9)", text: "#052E16", muted: "#166534", primary: "#22C55E", secondary: "#84CC16", accent: "#F97316" },
  { id: "minimal-white", name: "Minimal White", description: "Limpo, elegante e comercial.", mode: "light", background: "#F8FAFC", gradientFrom: "#FFFFFF", gradientTo: "#E2E8F0", card: "rgba(255,255,255,0.94)", text: "#0F172A", muted: "#64748B", primary: "#0F172A", secondary: "#334155", accent: "#06B6D4" },
  { id: "orange-neon", name: "Orange Neon", description: "Vendas rápidas, Pix e balcão.", mode: "dark", background: "#09090B", gradientFrom: "#09090B", gradientTo: "#431407", card: "rgba(24,24,27,0.84)", text: "#FAFAFA", muted: "#FDBA74", primary: "#F97316", secondary: "#06B6D4", accent: "#FACC15" },
  { id: "green-clean", name: "Green Clean", description: "Natural, limpo e confiável.", mode: "light", background: "#F7FEE7", gradientFrom: "#F7FEE7", gradientTo: "#CCFBF1", card: "rgba(255,255,255,0.92)", text: "#064E3B", muted: "#0F766E", primary: "#10B981", secondary: "#14B8A6", accent: "#84CC16" },
];

export function getThemePresetById(id?: string) {
  return themePresets.find((preset) => preset.id === id) ?? themePresets[0];
}
