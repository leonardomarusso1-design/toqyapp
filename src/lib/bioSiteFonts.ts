import { Bebas_Neue, Caveat, Merriweather, Oswald, Playfair_Display, Poppins } from "next/font/google";

// Fonte por bio site (2026-09-07, referência Coonexta — vídeo do
// Leonardo: "Estilo da letra do mini-site... toque para alterar"). Antes
// disso, TODO bio site renderizava com a mesma fonte de display do
// APLICATIVO Toqy (Bricolage Grotesque, herdada de layout.tsx) — não
// existia nenhum controle por site.
//
// next/font/google exige que cada fonte seja instanciada em escopo de
// MÓDULO (não dá pra chamar `Poppins({...})` dentro de uma função ou
// condicionalmente — é uma regra do plugin SWC do Next). Por isso as 6
// opções nascem todas aqui, uma vez, e o componente que usa escolhe qual
// `variable` aplicar via `bioSiteFontMap[id]`. "Padrão" (id vazio/undefined)
// não entra nesta lista — significa "sem override", herda Manrope do
// layout do app, como sempre foi.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-site-poppins", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-site-playfair", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"], variable: "--font-site-bebas", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-site-caveat", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-site-oswald", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-site-merriweather", display: "swap" });

export type BioSiteFontId = "poppins" | "playfair" | "bebas" | "caveat" | "oswald" | "merriweather";

// Lista pra UI do editor (label + amostra visual do próprio font-family,
// pra o dropdown mostrar cada opção já na fonte real — mesmo princípio
// do seletor de fonte do Coonexta).
export const BIO_SITE_FONTS: { id: BioSiteFontId; label: string; cssFamily: string; variable: string }[] = [
  { id: "poppins", label: "Poppins — arredondada, amigável", cssFamily: "var(--font-site-poppins)", variable: poppins.variable },
  { id: "playfair", label: "Playfair Display — elegante, serifada", cssFamily: "var(--font-site-playfair)", variable: playfair.variable },
  { id: "bebas", label: "Bebas Neue — forte, impacto", cssFamily: "var(--font-site-bebas)", variable: bebas.variable },
  { id: "caveat", label: "Caveat — manuscrita, pessoal", cssFamily: "var(--font-site-caveat)", variable: caveat.variable },
  { id: "oswald", label: "Oswald — condensada, versátil", cssFamily: "var(--font-site-oswald)", variable: oswald.variable },
  { id: "merriweather", label: "Merriweather — serifada, legível", cssFamily: "var(--font-site-merriweather)", variable: merriweather.variable },
];

export function bioSiteFontById(id?: string) {
  return BIO_SITE_FONTS.find((f) => f.id === id);
}
