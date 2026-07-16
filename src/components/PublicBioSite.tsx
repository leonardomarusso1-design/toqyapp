"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  Globe2,
  Image as ImageIcon,
  Images,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Save,
  Share2,
  Star,
  Wifi,
  X,
} from "lucide-react";
import type { CatalogItem, CatalogLayout, ToqyButton, ToqyLinkType, ToqySite } from "@/lib/types";
import { buttonHref, createVCard, pixPayload, whatsappUrl, wifiPayload } from "@/lib/buttonUtils";
import { ensureUrl, normalizeInstagram } from "@/lib/security";
import { getPlan, resolvePlanTier } from "@/lib/subscriptions";
import { analytics } from "@/lib/analytics";

// Ícones originais (2026-07-16, pedido do Leonardo) — PNGs próprios em vez
// dos SVGs de marca genéricos abaixo. Mesma assinatura (className) das
// funções antigas de propósito: todos os ~15 call sites deste arquivo
// continuam funcionando sem mudar nada além da definição aqui. Cor fixa do
// PNG (não usa currentColor) — troca a adaptação dinâmica de cor por
// identidade visual própria, que foi o pedido.
const WhatsAppIcon = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/whatsapp.png" alt="WhatsApp" className={`${className ?? ""} object-contain`} />
);

const InstagramIcon = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/instagram.png" alt="Instagram" className={`${className ?? ""} object-contain`} />
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.16 8.16 0 004.77 1.52V6.91a4.85 4.85 0 01-1-.22z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/facebook.png" alt="Facebook" className={`${className ?? ""} object-contain`} />
);

const PhoneIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.3 2.28a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const MapPinIcon2 = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/images/icons/localizacao.png" alt="Localização" className={`${className ?? ""} object-contain`} />
);

const WifiIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
  </svg>
);

const PixIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.764 2.337a1.8 1.8 0 012.47 0l1.862 1.848a.6.6 0 00.424.174h2.63a1.8 1.8 0 011.746 1.747v2.629a.6.6 0 00.175.424l1.847 1.862a1.8 1.8 0 010 2.47l-1.847 1.862a.6.6 0 00-.175.424v2.629a1.8 1.8 0 01-1.747 1.747h-2.629a.6.6 0 00-.424.175l-1.861 1.847a1.8 1.8 0 01-2.471 0l-1.862-1.847a.6.6 0 00-.424-.175H6.85a1.8 1.8 0 01-1.747-1.747v-2.629a.6.6 0 00-.174-.424L3.08 13.47a1.8 1.8 0 010-2.47l1.848-1.862a.6.6 0 00.174-.424V6.085A1.8 1.8 0 016.85 4.338h2.629a.6.6 0 00.424-.174l1.862-1.847z"/>
  </svg>
);

const iconByType: Partial<Record<ToqyLinkType, React.ComponentType<{ className?: string }>>> = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  phone: PhoneIcon2,
  maps: MapPinIcon2,
  wifi: WifiIcon2,
  pix: PixIcon,
  pixHub: QrCode,
  catalog: FileText,
  review: Star,
  booking: CalendarCheck,
  website: Globe2,
  email: Mail,
  menu: FileText,
  pdf: FileText,
  drive: FileText,
  image: ImageIcon,
  custom: LinkIcon,
  linkedin: Globe2,
  youtube: Globe2,
  telegram: MessageCircle,
};

// Tipos cujo ícone é uma imagem própria já colorida (2026-07-16) — usados
// pra pular o círculo de fundo no quick-row de ícones sociais (ver
// socialButtons.map abaixo) e pro controle de tamanho pequeno/médio/grande.
const IMAGE_ICON_TYPES: ToqyLinkType[] = ["whatsapp", "instagram", "facebook", "maps"];

const SOCIAL_ICON_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

// Tamanho do h1 (nome do negócio), 2026-07-16 — "md" é o text-2xl de sempre.
const NAME_FONT_SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

type Modal = "wifi" | "pix" | null;

function radiusClass(site: ToqySite) {
  if (site.theme.buttonRadius === "pill") return "rounded-full";
  if (site.theme.buttonRadius === "rounded") return "rounded-[1.55rem]";
  return "rounded-2xl";
}

function logoSize(site: ToqySite) {
  if (site.profile.logoSize === "small") return "h-20 w-20";
  if (site.profile.logoSize === "large") return "h-32 w-32";
  return "h-28 w-28";
}

function logoShape(site: ToqySite) {
  if (site.profile.logoShape === "circle") return "rounded-full";
  if (site.profile.logoShape === "rounded") return "rounded-[2rem]";
  return "rounded-2xl";
}

// Fundo de imagem "fixo" (2026-07-16) — bug real corrigido: a imagem era
// aplicada com backgroundAttachment: "scroll" (nunca fixo de verdade) direto
// no container que cresce com o conteúdo (min-h-screen, mas mais alto se a
// página tiver mais conteúdo que 1 tela) — background-size: "cover" recalcula
// contra essa altura CRESCENTE, esticando a imagem cada vez mais conforme
// mais seções eram adicionadas. background-attachment: fixed também não é
// confiável no Safari/iOS. Fix: camada position:fixed separada (ver
// backgroundImageUrl() abaixo) — altura sempre = viewport, nunca estica,
// conteúdo rola livremente por cima.
//
// Segundo bug real corrigido (2026-07-15): biosite é um formato de CELULAR
// (conteúdo em <main class="max-w-[430px]">), mas a camada de fundo usava
// inset:0 do viewport inteiro. Num navegador desktop isso espalhava a
// imagem pela tela toda (ex: 1920px), sem nenhuma relação com a coluna
// estreita de conteúdo por cima — e o crop do "cover" mudava a cada
// resize da janela, então preview/publicado nunca mostravam o mesmo
// pedaço da imagem. E no preview embutido (LiveBioSitePreview/PhoneMockup),
// como não havia containing block pra position:fixed dentro da moldura, o
// código caía pra position:absolute — que, dentro de um ancestral
// min-h-screen (crescente com o conteúdo do catálogo), esticava o "cover"
// por várias telas de altura, ficando quase liso/sem imagem visível.
// Fix: a camada de fundo agora é SEMPRE position:fixed (ver PhoneMockup.tsx,
// que ganhou um `transform` só pra virar o containing block do fixed
// dentro da moldura do celular simulado) e a imagem em si fica presa a uma
// coluna central de max-w-[430px] — a mesma largura do <main> — em vez de
// esticar pelo viewport inteiro. Fora dessa coluna (telas largas), quem
// preenche é o mesmo gradiente do tema (themeGradient), não a foto.
function backgroundImageUrl(site: ToqySite): string | undefined {
  const plaque = site.plaqueTheme?.useSameBackground && site.plaqueTheme.backgroundImageUrl;
  const image = plaque ? site.plaqueTheme?.backgroundImageUrl : site.profile.backgroundImageUrl;
  return (site.theme.backgroundType === "image" || plaque) && image ? image : undefined;
}

function backgroundOverlayGradient(site: ToqySite): string {
  const isDark = site.theme.mode === "dark";
  return isDark
    ? "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.55) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.30) 100%)";
}

function themeGradient(site: ToqySite): string {
  return `radial-gradient(circle at 50% 0%, ${site.theme.primary}33, transparent 34%), linear-gradient(160deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})`;
}

function backgroundStyle(site: ToqySite): React.CSSProperties {
  // Bug real corrigido (2026-07-16): backgroundColor sólido aqui tampava a
  // camada de imagem (position:fixed, -z-10, ver render abaixo) — o
  // container normal (z-index:auto) fica NA FRENTE de um filho com z-index
  // negativo no mesmo contexto de empilhamento, escondendo a imagem inteira
  // atrás de uma cor sólida. Com imagem, este container fica transparente —
  // quem pinta o fundo é só a camada fixa (que já leva seu próprio
  // themeGradient como "letterbox" fora da coluna de 430px, ver render).
  if (backgroundImageUrl(site)) return {};
  if (site.theme.backgroundType === "solid") return { background: site.theme.background };
  return { background: themeGradient(site) };
}

function solidBg(_site: ToqySite): React.CSSProperties { return {}; }

function glassCard(site: ToqySite): React.CSSProperties {
  const isLight = site.theme.mode === "light";
  return {
    background: isLight ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.12)",
    borderColor: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.18)",
    boxShadow: isLight ? "0 18px 45px rgba(15,23,42,.10)" : "0 20px 70px rgba(0,0,0,.20)",
  };
}

function buttonStyle(site: ToqySite): React.CSSProperties {
  const colors = site.theme.colors;
  const fill = site.theme.buttonFill;
  // Glass e Gradiente ignoram cores granulares de botão — são automáticos
  if (fill === "glass") return {
    background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.13)",
    color: colors?.buttonText ?? site.theme.text,
    borderColor: colors?.buttonBorder ?? (site.theme.mode === "light" ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.18)")
  };
  if (fill === "gradient") return {
    background: `linear-gradient(135deg, ${colors?.buttonBg ?? site.theme.primary}, ${site.theme.secondary})`,
    color: colors?.buttonText ?? (site.theme.mode === "light" ? "#ffffff" : "#F8FAFC"),
    borderColor: "rgba(255,255,255,0.18)"
  };
  // Sólido — usa cores granulares se definidas
  return {
    background: colors?.buttonBg ?? site.theme.primary,
    color: colors?.buttonText ?? (site.theme.mode === "light" ? "#ffffff" : "#F8FAFC"),
    borderColor: colors?.buttonBorder ?? "rgba(255,255,255,0.18)"
  };
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}

function uniqueGroups(items: CatalogItem[]) {
  const groups = new Map<string, CatalogItem[]>();
  items.forEach((item) => {
    const key = item.category?.trim() || "Destaques";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries());
}

// Chave de agrupamento (2026-07-16, subcategorias): normalmente é só a
// categoria do item. Mas quando a categoria está em modo "Subcategorias"
// (ex: "Home Office" com Cadeiras/Mesas/Estantes dentro) e o item tem uma
// subcategoria preenchida, a chave vira categoria+subcategoria — assim
// "Cadeiras" e "Mesas" viram capas SEPARADAS (cada uma com sua própria
// galeria), em vez de tudo cair numa capa só de "Home Office".
function groupKey(item: CatalogItem): string {
  if (item.displaySection === "subcategorias" && item.subcategory?.trim()) {
    return `${item.category?.trim() || "Destaques"}::${item.subcategory.trim()}`;
  }
  return item.category?.trim() || "Destaques";
}

// Correção de bug real reportado por cliente (2026-07-16): antes desta
// função, uma categoria com várias fotos (ex: "Diretoria" com 5 fotos)
// aparecia com as 5 fotos soltas, como cards separados, direto na página
// principal do catálogo — clicar em qualquer uma abria a galeria da
// categoria (CategoryGalleryModal) mostrando os MESMOS itens já visíveis,
// sem nada de "escondido" de verdade (o clique parecia não fazer nada).
// Agora a página principal mostra só 1 card por categoria (ou por
// categoria+subcategoria, ver groupKey acima) — o primeiro item cadastrado
// nela, na ordem em que foi criado — com o badge "+N" (já existente)
// indicando quantas fotos a mais existem. As demais fotos só aparecem ao
// clicar na foto e abrir a galeria. Grupo com 1 item só não muda em nada
// (nunca teve o que esconder). Usado em toda renderização "achatada"
// (grid/stack/scroller simples e as seções destaque/carrossel/grade/lista/
// padrão) — NÃO no layout "Por categoria" (grouped/category-carousel), que
// mostra cada categoria inteira de propósito, como um modo de exibição
// alternativo e deliberado.
function representativeItemsByCategory(items: CatalogItem[]): CatalogItem[] {
  const seen = new Set<string>();
  const result: CatalogItem[] = [];
  items.forEach((item) => {
    const key = groupKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
}

export function PublicBioSite({ site, publicUrl, instanceId }: { site: ToqySite; publicUrl?: string; instanceId?: string }) {
  const [modal, setModal] = useState<Modal>(null);
  const [qrModal, setQrModal] = useState(false);

  // URL e id do catálogo — quando publicUrl/instanceId são omitidos, comportamento
  // idêntico ao anterior (window.location.href e id fixo "catalogo-toqy"). Necessário
  // pra renderizar várias instâncias simultâneas (vitrine da landing/galeria de templates)
  // sem que todas mostrem o mesmo QR Code ou disputem o mesmo id de scroll.
  const url = publicUrl ?? (typeof window !== "undefined" ? window.location.href : "");
  const catalogId = instanceId ? `catalogo-toqy-${instanceId}` : "catalogo-toqy";

  // Analytics real (2026-07-16) — só conta como "visualização" quando é a
  // página pública de verdade (sem instanceId), nunca as instâncias de
  // vitrine/showcase da landing (que reusam este mesmo componente pra
  // mostrar vários bio sites de exemplo na mesma página).
  useEffect(() => {
    if (instanceId) return;
    analytics.trackPageView(site.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id, instanceId]);

  // Helper: retorna cor granular com fallback para tema global
  const col = (key: keyof NonNullable<typeof site.theme.colors>, fallback: string) =>
    site.theme.colors?.[key] ?? fallback;
  const [copied, setCopied] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();

  // Gating real de plano (2026-07-13) — antes disso, Catálogo/Pix/Wi-Fi
  // ficavam liberados pra QUALQUER plano no site público, mesmo Gratuito,
  // porque nada aqui checava site.ownerPlan (só a quantidade de bio sites
  // era travada, em outro lugar do app). site.ownerPlan é gravado no
  // save/fetch do bio site (ver biositeSync.ts, api/biosite/save) — se por
  // algum motivo vier vazio, cai em "free" (mais restritivo, nunca libera
  // por engano).
  const plan = getPlan(resolvePlanTier(site.ownerPlan));
  const activeButtons = site.buttons
    .filter((button) => button.enabled)
    .filter((button) => {
      if ((button.type === "pix" || button.type === "pixHub") && !plan.hasPix) return false;
      if (button.type === "wifi" && !plan.hasWifi) return false;
      if (button.type === "catalog" && !plan.hasCatalog) return false;
      return true;
    });
  const activeCatalog = plan.hasCatalog ? site.catalog.filter((item) => item.enabled) : [];
  const catalogLayout: CatalogLayout = site.catalogLayout ?? "carousel";
  const vcard = useMemo(() => createVCard(site), [site]);

  async function copyText(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function shareSite() {
    if (navigator.share) {
      try {
        await navigator.share({ title: site.profile.name, text: site.profile.description, url });
      } catch (err) {
        // AbortError = usuário fechou o menu de compartilhamento — não é erro real
        if (err instanceof Error && err.name === "AbortError") return;
        await copyText(url, "share");
      }
    } else {
      await copyText(url, "share");
    }
  }

  function downloadVCard() {
    const pageUrl = url || site.contact.website;
    const contactCard = site.contact.website || !pageUrl ? vcard : vcard.replace("END:VCARD", `URL:${pageUrl}\nEND:VCARD`);
    const blob = new Blob([contactCard], { type: "text/vcard;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${site.slug || "toqy"}.vcf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  function handleButton(button: ToqyButton) {
    if (button.type === "wifi") return setModal("wifi");
    if (button.type === "pix" || button.type === "pixHub") return setModal("pix");
    if (button.type === "catalog") {
      document.getElementById(catalogId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const href = buttonHref(site, button);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  }

  const ButtonIcon = ({ type, color, className }: { type: ToqyLinkType; color?: string; className?: string }) => {
    const Icon = iconByType[type] ?? LinkIcon;
    return <Icon className={className ?? "h-5 w-5 shrink-0"} style={color ? { color } : undefined} />;
  };

  const SOCIAL_TYPES = ["whatsapp", "instagram", "facebook", "tiktok", "linkedin", "youtube", "email"];
  // displayAs="icon" força ícone, displayAs="button" força botão grande, undefined = automático por tipo
  const socialButtons = activeButtons.filter((b) =>
    b.displayAs === "icon" || (!b.displayAs && SOCIAL_TYPES.includes(b.type))
  ).filter(b => b.displayAs !== "button");
  const wifiInline = plan.hasWifi && site.wifi?.enabled && site.wifi.ssid && site.wifi.showInline !== false;
  const mainButtons = activeButtons.filter((b) =>
    b.displayAs === "button" || (!b.displayAs && !SOCIAL_TYPES.includes(b.type) && b.type !== "phone" && !(wifiInline && b.type === "wifi"))
  );

  const bgImage = backgroundImageUrl(site);

  return (
    <div className="relative min-h-screen w-full" style={{ ...backgroundStyle(site), color: site.theme.text }}>
      {bgImage ? (
        <div className="fixed inset-0 -z-10" style={{ background: themeGradient(site) }}>
          <div
            className="absolute inset-0 mx-auto w-full max-w-[430px]"
            style={{
              // Bug real corrigido (2026-07-16): o gradiente de escurecimento
              // era aplicado SEMPRE que havia imagem de fundo, ignorando
              // site.theme.useBackgroundOverlay por completo (o campo existe
              // no tipo e é setado por templates/onboarding, mas nunca era
              // lido aqui) — mesmo em modo claro o gradiente termina em
              // rgba(0,0,0,0.30) embaixo, então um fundo branco escolhido de
              // propósito sempre saía acinzentado/escurecido na base, sem
              // controle nenhum do usuário pra desligar isso.
              backgroundImage: site.theme.useBackgroundOverlay
                ? `${backgroundOverlayGradient(site)}, url(${bgImage})`
                : `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      ) : null}
      <div className="min-h-screen w-full">
        <main className="mx-auto w-full max-w-[430px] px-4 py-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setQrModal(true)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl" style={glassCard(site)}><QrCode className="h-4 w-4" />QR Code</button>
            <button type="button" onClick={shareSite} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl" style={glassCard(site)}><Share2 className="h-4 w-4" />{copied === "share" ? "Copiado" : "Compartilhar"}</button>
          </div>

          <header className="text-center">
            <div className={`${logoSize(site)} ${logoShape(site)} relative mx-auto overflow-hidden shadow-2xl`} style={{ border: (site.profile.logoUrl || site.profile.profileImageUrl) ? "none" : `2px solid ${site.theme.primary}88`, background: "transparent" }}>
              {site.profile.logoUrl || site.profile.profileImageUrl ? (
                <img
                  src={site.profile.logoUrl || site.profile.profileImageUrl}
                  alt={site.profile.name}
                  loading="eager"
                  fetchPriority="high"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: site.profile.logoFit ?? "cover",
                    objectPosition: site.profile.profileImagePosition ?? "center",
                  }}
                />
              ) : (
                <span className="text-4xl font-black text-white">{getInitials(site.profile.name)}</span>
              )}
            </div>
          <h1 className={`mt-5 ${NAME_FONT_SIZE_CLASS[site.theme.nameFontSize ?? "md"]} font-black leading-tight drop-shadow-sm`} style={{ color: col("name", site.theme.text), textShadow: site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.name}</h1>
            {site.profile.title ? <p className="mt-1 text-base font-medium" style={{ color: col("title", site.theme.muted) }}>{site.profile.title}</p> : null}
            {site.profile.location ? (
              <div className="mt-2 flex flex-col items-center gap-0.5">
              <div className="flex items-start justify-center gap-1">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: col("location", site.theme.muted) }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {/* text-left (2026-07-15) é o padrão: com text-center, um
                    endereço que quebra em 2 linhas fica com a 2ª linha (mais
                    curta) centralizada sob a 1ª — visualmente longe do
                    ícone, que só alinha com a 1ª linha. Com as linhas
                    coladas à esquerda, ambas ficam rente ao ícone.
                    locationAlign="center" (2026-07-16) é opt-in pra quem
                    prefere centralizado mesmo com esse trade-off. */}
                <p className={`${site.theme.locationAlign === "center" ? "text-center" : "text-left"} text-sm font-semibold leading-snug`} style={{ color: col("location", site.theme.muted) }}>{site.profile.location}</p>
              </div>
            </div>
            ) : null}
            {site.profile.description ? <p className="mx-auto mt-4 max-w-[350px] text-center text-sm leading-relaxed" style={{ color: col("description", site.theme.muted) }}>{site.profile.description}</p> : null}
            {site.profile.logoSignatureUrl ? (
              <img src={site.profile.logoSignatureUrl} alt={`${site.profile.name} assinatura`} className="mx-auto mt-4 max-h-20 max-w-[260px] object-contain drop-shadow-lg" />
            ) : null}
            {site.profile.logoText ? (
              <p className="mt-3 tracking-widest drop-shadow-lg" style={{ color: site.theme.text, fontSize: "clamp(13px, 4vw, 20px)", fontFamily: site.profile.logoFont === "serif" || site.profile.logoFont === "italic" ? "Georgia, serif" : site.profile.logoFont === "mono" ? "monospace" : "inherit", fontWeight: !site.profile.logoFont || site.profile.logoFont === "bold" ? 900 : 700, fontStyle: site.profile.logoFont === "italic" ? "italic" : "normal", letterSpacing: "0.15em", textTransform: "uppercase", textShadow: site.theme.mode === "dark" ? "0 2px 12px rgba(0,0,0,0.6)" : "none" }}>{site.profile.logoText}</p>
            ) : null}
          </header>

          <section className="mt-4 grid grid-cols-2 gap-2">
            {site.modules?.saveContact !== false ? <button type="button" onClick={downloadVCard} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={{ ...glassCard(site), color: col("saveContactText", site.theme.text) }}><Save className="h-4 w-4" />Salvar Contato</button> : null}
            {site.contact.phone ? <button type="button" onClick={() => window.open(`tel:${site.contact.phone.replace(/\D/g, "")}`)} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={{ ...glassCard(site), color: col("callText", site.theme.text) }}><Phone className="h-4 w-4" />Ligar</button> : null}
          </section>

          {/* Wi-Fi inline — mostra rede e senha sem precisar abrir modal */}
          {wifiInline ? (
            <section className="mt-3 rounded-2xl border px-4 py-2.5 backdrop-blur-xl" style={glassCard(site)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <WifiIcon2 className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="text-xs font-black truncate" style={{ color: col("wifiText", site.theme.text) }}>
                    Wi-Fi: <span className="font-mono">{site.wifi.ssid}</span>
                    {site.wifi.password ? <> &nbsp;·&nbsp; Senha: <span className="font-mono">{site.wifi.password}</span></> : null}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(site.wifi.password || site.wifi.ssid, "wifi")}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-black transition"
                  style={{ background: site.theme.primary + "22", color: site.theme.primary }}
                >
                  {copied === "wifi" ? "Copiado!" : "Copiar senha"}
                </button>
              </div>
            </section>
          ) : null}

          {socialButtons.length ? (
            <section className="mt-3 flex items-center justify-center gap-3">
              {socialButtons.map((button) => {
                const brandColor: Record<string, string> = {
                  whatsapp: "#25D366", instagram: "#E1306C", facebook: "#1877F2",
                  tiktok: "#010101", linkedin: "#0A66C2", youtube: "#FF0000", email: "#EA4335",
                };
                const useGlass = site.theme.socialIconStyle === "glass";
                const isBrandType = button.type in brandColor;

                // Ícones com imagem própria (2026-07-16, pedido do Leonardo:
                // "tira esse contorno, deixa só os ícones com as cores
                // deles") — whatsapp/instagram/facebook/maps agora são PNGs
                // já coloridos (ver WhatsAppIcon/InstagramIcon/FacebookIcon/
                // MapPinIcon2 acima), então o círculo de fundo + tint de cor
                // do padrão antigo só duplicava contorno em cima do ícone.
                // Renderiza sem bg/sombra, só o ícone maior, tamanho
                // controlável em socialIconSize (padrão "md").
                if (IMAGE_ICON_TYPES.includes(button.type)) {
                  const sizeClass = SOCIAL_ICON_SIZE_CLASS[site.theme.socialIconSize ?? "md"];
                  return (
                    <button key={button.id} type="button" onClick={() => handleButton(button)} aria-label={button.label}
                      className="flex items-center justify-center p-1 transition active:scale-90 hover:scale-105">
                      <ButtonIcon type={button.type} className={sizeClass} />
                    </button>
                  );
                }

                const bg = useGlass
                  ? (site.theme.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")
                  : (brandColor[button.type] ?? site.theme.primary);
                // Bug real corrigido (2026-07-16): ícone branco fixo quebrava
                // (sumia) quando o fundo caía no fallback theme.primary (tipo
                // sem cor de marca, ex: mapa/localização) E o usuário definia
                // "Cor dos botões" como branco — branco no branco, invisível.
                // Marcas (whatsapp/instagram/...) sempre têm fundo saturado o
                // suficiente pra branco ficar legível; pro fallback, usa
                // theme.text (a mesma cor que o usuário já ajusta pra
                // legibilidade geral do site).
                const iconColor = useGlass || !isBrandType ? site.theme.text : "#fff";
                return (
                  <button key={button.id} type="button" onClick={() => handleButton(button)} aria-label={button.label}
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-md transition active:scale-90 hover:scale-105 backdrop-blur-sm"
                    style={{ background: bg }}>
                    <ButtonIcon type={button.type} color={iconColor} />
                  </button>
                );
              })}
            </section>
          ) : null}

          <section className={site.theme.buttonStyle === "icon" ? "mt-5 grid grid-cols-3 gap-3" : "mt-5 space-y-3"}>
            {mainButtons.map((button) => {
              if (site.theme.buttonStyle === "icon") {
                return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex min-h-24 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black shadow-lg transition active:scale-[0.98]`} style={buttonStyle(site)}><ButtonIcon type={button.type} /><span>{button.label}</span></button>;
              }
              return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex w-full items-center justify-center gap-2 border px-4 py-3.5 text-center text-sm font-black shadow-md backdrop-blur-xl transition active:scale-[0.98]`} style={buttonStyle(site)}><ButtonIcon type={button.type} /><span>{button.label}</span></button>;
            })}
          </section>

          {(site.promoCard?.enabled ?? true) ? (
            <section className="mt-5 rounded-[1.75rem] border p-4 backdrop-blur-xl" style={glassCard(site)}>
              <p className="text-sm font-black">{site.promoCard?.title || "Mais praticidade em um só lugar"}</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: site.theme.muted }}>{site.promoCard?.description || "Acesse contatos, Pix, Wi-Fi, catálogo, rotas e avaliações sem procurar em vários lugares."}</p>
              <button type="button" onClick={() => document.getElementById(catalogId)?.scrollIntoView({ behavior: "smooth" })} className="mt-3 rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.text, color: site.theme.background }}>{site.promoCard?.buttonLabel || "Ver mais"}</button>
            </section>
          ) : null}

          {activeCatalog.length ? <CatalogSection site={site} items={activeCatalog} layout={catalogLayout} catalogId={catalogId} /> : null}

          <footer className="mt-8 pb-6 text-center text-xs font-bold leading-relaxed" style={{ color: site.theme.muted }}>
            <p style={{ color: site.theme.muted }}>© {new Date().getFullYear()} {site.profile.name}. Todos os direitos reservados.</p>
            {/* Selo "Criado com TOQY" — antes aparecia em TODO bio site,
                mesmo pra quem paga Agência (que promete "White label
                parcial" desde sempre, mas nada aqui checava isso). Primeira
                entrega real de white-label (2026-07-16): esconde o selo
                pra quem tem hasWhiteLabel. */}
            {!plan.hasWhiteLabel ? (
              <p className="mt-1" style={{ color: site.theme.muted }}>
                Criado com{" "}
                <a href="https://toqy.com.br" target="_blank" rel="noreferrer" className="font-black underline-offset-4 hover:underline" style={{ color: site.theme.primary }}>
                  TOQY
                </a>
              </p>
            ) : null}
          </footer>
        </main>
      </div>

      {qrModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setQrModal(false)}>
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="mb-4 text-sm font-black text-slate-500 uppercase tracking-widest">QR Code</p>
            <p className="mb-5 font-black text-slate-900 text-lg">{site.profile.name}</p>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 inline-block">
              <QRCodeSVG value={url} size={200} />
            </div>
            <p className="mt-4 text-xs text-slate-400 break-all max-w-[240px] mx-auto">{url}</p>
            <button onClick={() => { copyText(url, "qr"); }} className="mt-4 block w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white">
              {copied === "qr" ? "✓ Link copiado!" : "Copiar link"}
            </button>
            <button onClick={() => setQrModal(false)} className="mt-2 block w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Fechar</button>
          </div>
        </div>
      ) : null}
      {modal === "wifi" ? <WifiModal site={site} onClose={() => setModal(null)} copied={copied} copyText={copyText} /> : null}
      {modal === "pix" ? <PixModal site={site} onClose={() => setModal(null)} copied={copied} copyText={copyText} selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount} /> : null}
    </div>
  );
}

function CatalogSection({ site, items, layout, catalogId }: { site: ToqySite; items: CatalogItem[]; layout: CatalogLayout; catalogId: string }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category?.trim() || "Destaques"))), [items]);
  const filteredItems = activeCategory === "Todas" ? items : items.filter((item) => (item.category?.trim() || "Destaques") === activeCategory);

  // Vitrine flutuante por categoria (2026-07-13) — pedido real de clientes
  // do Toqy (ex: restaurante de yakisoba com categoria "Yakisoba de carne"):
  // clicar na FOTO de um item abre uma mini galeria mostrando os outros
  // itens da mesma categoria, sem sair da página. Usa a mesma lista COMPLETA
  // de itens (não a filtrada por activeCategory) — clicar na foto sempre
  // mostra a categoria inteira daquele item, mesmo que a pessoa esteja
  // vendo "Todas" no momento.
  const [galleryCategory, setGalleryCategory] = useState<string | null>(null);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const key = groupKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [items]);
  // Só abre a galeria se o grupo (categoria, ou categoria+subcategoria) tiver
  // mais de 1 item — grupo único não tem "mais peças" pra mostrar.
  const openGallery = (key: string) => {
    if ((categoryCounts.get(key) ?? 0) > 1) setGalleryCategory(key);
  };
  const galleryItems = galleryCategory ? items.filter((item) => groupKey(item) === galleryCategory) : [];
  // Título da galeria: se for um grupo de subcategoria, mostra só a parte
  // depois do "::" (ex: "Cadeiras"), não a chave interna inteira.
  const galleryTitle = galleryCategory?.includes("::") ? galleryCategory.split("::")[1] : galleryCategory;
  const whatsapp = whatsappUrl(site);
  const chipStyle = (active: boolean): React.CSSProperties => active
    ? { background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F", borderColor: "transparent" }
    : { background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.10)", color: site.theme.text, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.16)" };

  // Agrupa itens por displaySection — itens com seção específica aparecem separados
  const itemsBySection = useMemo(() => {
    const destaques = filteredItems.filter(i => i.displaySection === "destaque");
    const carrossel = filteredItems.filter(i => i.displaySection === "carrossel");
    const grade = filteredItems.filter(i => i.displaySection === "grade");
    const lista = filteredItems.filter(i => i.displaySection === "lista");
    const subcategorias = filteredItems.filter(i => i.displaySection === "subcategorias");
    const padrao = filteredItems.filter(i => !i.displaySection || i.displaySection === "padrao");
    return { destaques, carrossel, grade, lista, subcategorias, padrao };
  }, [filteredItems]);

  const hasCustomSections = filteredItems.some(i => i.displaySection && i.displaySection !== "padrao");

  function renderLayout(l: CatalogLayout, items2: CatalogItem[]) {
    if (l === "grouped" || l === "category-carousel") {
      return (
        <div className="space-y-7">
          {uniqueGroups(items2).map(([group, groupItems]) => (
            <div key={group}>
              <h3 className="mb-3 text-base font-black" style={{ color: site.theme.muted }}>{group}</h3>
              <CatalogScroller site={site} items={groupItems} onOpenGallery={openGallery} />
            </div>
          ))}
        </div>
      );
    }
    const representative = representativeItemsByCategory(items2);
    if (l === "grid") return <div className="grid grid-cols-2 gap-3">{representative.map((item) => <CatalogCard key={item.id} site={site} item={item} compact onOpenGallery={openGallery} categoryCount={categoryCounts.get(groupKey(item)) ?? 1} />)}</div>;
    if (l === "stack") return <div className="space-y-4">{representative.map((item) => <CatalogCard key={item.id} site={site} item={item} stacked onOpenGallery={openGallery} categoryCount={categoryCounts.get(groupKey(item)) ?? 1} />)}</div>;
    return <CatalogScroller site={site} items={representative} onOpenGallery={openGallery} categoryCounts={categoryCounts} />;
  }

  return (
    <section id={catalogId} className="mt-8 scroll-mt-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: site.theme.accent }}>Catálogo</p>
      {(site.showCatalogTitle ?? true) ? <h2 className="mt-1 text-2xl font-black">{site.catalogTitle || "Produtos e serviços"}</h2> : null}
      {(site.showCatalogSubtitle ?? true) ? <p className="mt-1 text-sm leading-relaxed" style={{ color: site.theme.muted }}>{site.catalogSubtitle || "Selecionados para você. Toque em um item para pedir ou agendar."}</p> : null}

      {categories.length > 1 ? (
        <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <button type="button" onClick={() => setActiveCategory("Todas")} className="shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-black transition" style={chipStyle(activeCategory === "Todas")}>Todas</button>
          {categories.map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)} className="shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-black transition" style={chipStyle(activeCategory === category)}>{category}</button>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        {hasCustomSections ? (
          // Modo por seção: cada grupo aparece separado com seu layout
          <div className="space-y-8">
            {/* Correção de bug real (2026-07-16), 2 rodadas:
                1ª rodada: itens do mesmo "Onde aparece" (destaque/carrossel/
                grade/lista) eram jogados numa ÚNICA fileira, título tirado
                só do primeiro item — 2 categorias diferentes marcadas como
                "Carrossel" apareciam juntas, lado a lado. Corrigido
                agrupando por categoria primeiro (uniqueGroups).
                2ª rodada: a correção acima tinha ido longe demais — também
                reduzia cada categoria a 1 foto de capa só (representative
                ItemsByCategory), matando o efeito de slide/carrossel que
                "Carrossel — arrasta para o lado" promete no próprio nome.
                Diferença chave: esse dedup faz sentido pro catálogo PADRÃO
                (ninguém marcou nada, evita lotar a página com toda foto
                solta — ver itemsBySection.padrao abaixo), mas NÃO faz
                sentido quando o usuário escolheu explicitamente "Carrossel/
                Grade/Lista" pra um item — aí a escolha É pra aparecer todas
                as fotos daquela categoria, deslizando/em grade/em lista.
                Removido o dedup dessas 4 seções; onOpenGallery não é
                passado aqui (nada "escondido" pra abrir, já mostra tudo). */}
            {itemsBySection.destaques.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.accent }}>Destaques</p>
                <div className="space-y-4">{itemsBySection.destaques.map(item => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>
              </div>
            )}
            {itemsBySection.carrossel.length > 0 && uniqueGroups(itemsBySection.carrossel).map(([group, groupItems]) => (
              <div key={`carrossel-${group}`}>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{group}</p>
                <CatalogScroller site={site} items={groupItems} />
              </div>
            ))}
            {itemsBySection.grade.length > 0 && uniqueGroups(itemsBySection.grade).map(([group, groupItems]) => (
              <div key={`grade-${group}`}>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{group}</p>
                <div className="grid grid-cols-2 gap-3">{groupItems.map(item => <CatalogCard key={item.id} site={site} item={item} compact />)}</div>
              </div>
            ))}
            {itemsBySection.lista.length > 0 && uniqueGroups(itemsBySection.lista).map(([group, groupItems]) => (
              <div key={`lista-${group}`}>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{group}</p>
                <div className="space-y-4">{groupItems.map(item => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>
              </div>
            ))}
            {/* Subcategorias (2026-07-16): categoria vira um cabeçalho
                (ex: "Home Office"), e dentro dela 1 capa por subcategoria
                (ex: Cadeiras, Mesas, Estantes) lado a lado — cada capa abre
                a galeria só das fotos daquela subcategoria (groupKey já
                separa por categoria+subcategoria nesse modo). */}
            {itemsBySection.subcategorias.length > 0 && uniqueGroups(itemsBySection.subcategorias).map(([group, groupItems]) => (
              <div key={`subcat-${group}`}>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{group}</p>
                <CatalogScroller site={site} items={representativeItemsByCategory(groupItems)} onOpenGallery={openGallery} categoryCounts={categoryCounts} />
              </div>
            ))}
            {/* Categorias "padrão" (sem exibição específica escolhida em
                "Exibição por categoria") respeitam o Estilo padrão do
                catálogo (renderLayout), igual ao modo sem seções
                customizadas — antes ficava travado num carrossel fixo,
                ignorando o estilo escolhido, assim que QUALQUER outra
                categoria ganhava uma exibição específica (ex: Diretoria em
                Carrossel fazia até categorias sem nada configurado, tipo
                "Bolsas de couro", pararem de respeitar o Estilo padrão). */}
            {itemsBySection.padrao.length > 0 && (
              <div>
                {renderLayout(layout, itemsBySection.padrao)}
              </div>
            )}
          </div>
        ) : (
          // Modo sem seções customizadas — nenhuma categoria tem exibição
          // específica, tudo segue o Estilo padrão do catálogo.
          renderLayout(layout, filteredItems)
        )}
      </div>

      {(whatsapp || site.catalogWaLabel) ? (
        <div className="mt-5 rounded-[1.5rem] border p-4 text-center backdrop-blur-xl" style={{ background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.08)", borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.16)" }}>
          <p className="text-sm font-black" style={{ color: site.theme.text }}>{site.catalogWaLabel || "Não encontrou o que procura?"}</p>
          {/* Bug real corrigido (2026-07-16): cor do texto vinha fixa em
              "#fff" no código — se o usuário definisse "Cor dos botões"
              (theme.primary) como branco, o botão virava branco-no-branco,
              invisível, sem NENHUM controle de cor pra corrigir (não existia
              picker pra este botão específico). Agora reusa
              catalogActionBg/catalogActionText — os mesmos já editáveis na
              aba Catálogo ("Fundo botão de ação"/"Texto botão de ação"). */}
          {whatsapp ? <button type="button" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black" style={{ background: site.theme.colors?.catalogActionBg ?? site.theme.primary, color: site.theme.colors?.catalogActionText ?? (site.theme.mode === "light" ? "#fff" : "#06111F") }}><WhatsAppIcon className="h-4 w-4" />Fale com a gente no WhatsApp</button> : null}
        </div>
      ) : null}

      {galleryCategory ? (
        <CategoryGalleryModal site={site} category={galleryTitle ?? galleryCategory} items={galleryItems} onClose={() => setGalleryCategory(null)} />
      ) : null}
    </section>
  );
}

function CatalogScroller({ site, items, onOpenGallery, categoryCounts }: { site: ToqySite; items: CatalogItem[]; onOpenGallery?: (category: string) => void; categoryCounts?: Map<string, number> }) {
  return (
    <div className="flex snap-x gap-4 overflow-x-auto pb-3">
      {items.map((item) => (
        <CatalogCard key={item.id} site={site} item={item} onOpenGallery={onOpenGallery} categoryCount={categoryCounts?.get(groupKey(item)) ?? 1} />
      ))}
    </div>
  );
}

function CatalogCard({ site, item, compact = false, stacked = false, onOpenGallery, categoryCount = 1 }: { site: ToqySite; item: CatalogItem; compact?: boolean; stacked?: boolean; onOpenGallery?: (category: string) => void; categoryCount?: number }) {
  const width = stacked ? "w-full" : compact ? "w-full" : "min-w-[275px]";
  const imageHeight = compact ? "h-28" : item.imageLayout === "horizontal" ? "h-36" : "h-52";
  const whatsapp = whatsappUrl(site);
  // Vitrine por categoria: só clicável quando tem mais de 1 item na mesma
  // categoria (senão não há "mais peças" pra mostrar na galeria).
  const canOpenGallery = Boolean(onOpenGallery) && categoryCount > 1;
  const handleImageClick = canOpenGallery ? () => onOpenGallery!(groupKey(item)) : undefined;
  return (
    <article className={`${width} snap-start overflow-hidden rounded-[1.6rem] border shadow-xl backdrop-blur`} style={{ background: site.theme.colors?.catalogItemBg ?? site.theme.card, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)" }}>
      <div
        className={`${imageHeight} relative ${canOpenGallery ? "cursor-pointer" : ""}`}
        style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}
        onClick={handleImageClick}
        role={canOpenGallery ? "button" : undefined}
        aria-label={canOpenGallery ? `Ver mais itens de ${item.subcategory?.trim() || item.category?.trim() || "Destaques"}` : undefined}
      >
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="h-10 w-10 opacity-60" /></div>}
        {canOpenGallery ? (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
            <Images className="h-3 w-3" />+{categoryCount - 1}
          </span>
        ) : null}
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        {item.highlight ? <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-black" style={{ background: site.theme.colors?.catalogItemHighlight ? site.theme.colors.catalogItemHighlight + "22" : "#fef3c7", color: site.theme.colors?.catalogItemHighlight ?? "#b45309" }}>{item.highlight}</span> : null}
        {/* Item "só foto" (2026-07-16) — nome/descrição agora são opcionais
            (ver BulkCatalogPhotoAdd/SiteBuilder). Sem isso, um item sem nome
            mostrava um <h3> vazio ocupando espaço em branco no card. */}
        {item.name ? <h3 className={compact ? "text-sm font-black leading-tight" : "text-lg font-black"} style={{ color: site.theme.colors?.catalogItemName ?? site.theme.text }}>{item.name}</h3> : null}
        {item.description ? <p className={compact ? "mt-1 line-clamp-3 text-xs leading-relaxed" : "mt-2 text-sm leading-relaxed"} style={{ color: site.theme.colors?.catalogItemDesc ?? site.theme.muted }}>{item.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          {item.price ? <span className={compact ? "text-xs font-black" : "font-black"} style={{ color: site.theme.colors?.catalogItemPrice ?? site.theme.accent }}>{item.price}</span> : <span />}
          <div className="flex items-center gap-2">
            {whatsapp && site.showCatalogWhatsapp !== false ? <button type="button" aria-label="Falar no WhatsApp" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.18)", color: site.theme.text }}><WhatsAppIcon className="h-4 w-4" /></button> : null}
            {/* Bug real corrigido (2026-07-16): botão "Ver" aparecia em TODO
                item enquanto o toggle geral "Botão Ver nos itens" estivesse
                ligado, mesmo em fotos sem nenhum texto/link configurado —
                sem jeito de tirar o botão de UMA foto específica. Agora só
                aparece se o próprio item tem "Texto do botão" ou "Link do
                botão" preenchido — item vazio (só foto) não mostra botão,
                mesmo com o toggle geral ligado. */}
            {site.showCatalogAction !== false && (item.actionLabel || item.actionUrl) ? <button type="button" onClick={() => { const href = item.actionUrl ? ensureUrl(item.actionUrl) : whatsapp; if (href) window.open(href, "_blank", "noopener,noreferrer"); }} className="rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.colors?.catalogActionBg ?? site.theme.primary, color: site.theme.colors?.catalogActionText ?? (site.theme.mode === "light" ? "#fff" : "#06111F") }}>{item.actionLabel || "Ver"}</button> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

// Vitrine flutuante de categoria (2026-07-13) — abre por cima da página ao
// clicar na foto de um item do catálogo, mostrando os outros itens da MESMA
// categoria em grade. Reusa o ModalShell já usado pelo Pix/Wi-Fi, mesmo
// padrão visual (bottom-sheet no mobile, fecha ao tocar fora ou no X).
function CategoryGalleryModal({ site, category, items, onClose }: { site: ToqySite; category: string; items: CatalogItem[]; onClose: () => void }) {
  const whatsapp = whatsappUrl(site);
  return (
    <ModalShell title={category} onClose={onClose} site={site} icon={<Images className="h-6 w-6" />}>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-[1.2rem] border" style={{ background: site.theme.colors?.catalogItemBg ?? site.theme.card, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)" }}>
            <div className="h-28" style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}>
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="h-8 w-8 opacity-60" /></div>}
            </div>
            {/* Item "só foto" (2026-07-16): sem nome/preço/link próprio, não
                mostra rodapé nenhum (nome vazio + botão "Ver" abrindo o
                WhatsApp do site por padrão não fazia sentido pra uma foto
                solta de galeria, ex: "Diretoria"). */}
            {(item.name || item.price || item.actionUrl) ? (
              <div className="p-2.5">
                {item.name ? <p className="line-clamp-2 text-xs font-black leading-tight" style={{ color: site.theme.colors?.catalogItemName ?? site.theme.text }}>{item.name}</p> : null}
                {item.price ? <p className="mt-1 text-xs font-black" style={{ color: site.theme.colors?.catalogItemPrice ?? site.theme.accent }}>{item.price}</p> : null}
                <button
                  type="button"
                  onClick={() => { const href = item.actionUrl ? ensureUrl(item.actionUrl) : whatsapp; if (href) window.open(href, "_blank", "noopener,noreferrer"); }}
                  className="mt-2 w-full rounded-full px-2 py-1.5 text-[11px] font-black"
                  style={{ background: site.theme.colors?.catalogActionBg ?? site.theme.primary, color: site.theme.colors?.catalogActionText ?? (site.theme.mode === "light" ? "#fff" : "#06111F") }}
                >
                  {item.actionLabel || "Ver"}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function PixModal({ site, onClose, copied, copyText, selectedAmount, setSelectedAmount }: { site: ToqySite; onClose: () => void; copied: string; copyText: (value: string, key: string) => Promise<void>; selectedAmount?: number; setSelectedAmount: (value?: number) => void }) {
  const proofPhone = (site.pix.whatsappProofNumber || site.contact.whatsapp || site.contact.phone).replace(/\D/g, "");
  const proofUrl = proofPhone ? `https://wa.me/${proofPhone}?text=${encodeURIComponent(`Olá! Já realizei o pagamento via Pix${selectedAmount ? ` no valor de R$ ${selectedAmount.toFixed(2).replace(".", ",")}` : ""} e vou enviar o comprovante.`)}` : "";
  return (
    <ModalShell title="Pix inteligente" onClose={onClose} site={site} icon={<CreditCard className="h-6 w-6" />}>
      <div className="rounded-[1.75rem] bg-white p-4 text-center text-slate-950 shadow-xl">
        <div className="mx-auto w-fit rounded-3xl bg-slate-50 p-4"><QRCodeSVG value={pixPayload(site, selectedAmount)} size={190} /></div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recebedor</p>
        <p className="text-lg font-black">{site.pix.receiver || site.profile.name}</p>
        {site.pix.bank ? <p className="text-xs font-bold text-slate-500">{site.pix.bank}</p> : null}
        {site.pix.quickAmounts.length ? <div className="mt-4 flex flex-wrap justify-center gap-2">{site.pix.quickAmounts.map((amount) => <button key={amount} onClick={() => setSelectedAmount(selectedAmount === amount ? undefined : amount)} className={`rounded-full px-4 py-2 text-xs font-black ${selectedAmount === amount ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>R$ {amount}</button>)}</div> : null}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
          <p className="text-xs font-black text-slate-400">Chave Pix</p>
          <p className="mt-1 break-all font-mono text-sm font-black text-slate-900">{site.pix.key || "Configure a chave Pix"}</p>
        </div>
        <div className="mt-4 grid gap-2">
          <button onClick={() => copyText(site.pix.key, "pix")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{copied === "pix" ? "Chave copiada" : "Copiar chave Pix"}</button>
          {proofUrl ? <button onClick={() => window.open(proofUrl, "_blank")} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Já paguei / enviar comprovante</button> : null}
        </div>
      </div>
    </ModalShell>
  );
}

function WifiModal({ site, onClose, copied, copyText }: { site: ToqySite; onClose: () => void; copied: string; copyText: (value: string, key: string) => Promise<void> }) {
  const rawCheckinUrl = site.wifi.checkinUrl || site.links.googleReviewUrl || site.contact.facebook || site.contact.instagram || "";
  const checkinUrl = rawCheckinUrl === site.contact.instagram ? normalizeInstagram(rawCheckinUrl) : ensureUrl(rawCheckinUrl);
  const defaultCheckinLabel = site.wifi.checkinUrl
    ? "Fazer check-in"
    : site.links.googleReviewUrl
    ? "Avaliar no Google"
    : site.contact.facebook
    ? "Curtir no Facebook"
    : site.contact.instagram
    ? "Seguir no Instagram"
    : "Fazer check-in / avaliar";
  return (
    <ModalShell title="Rede Wi-Fi" onClose={onClose} site={site} icon={<Wifi className="h-6 w-6" />}>
      <div className="rounded-[1.75rem] bg-white p-4 text-center text-slate-950 shadow-xl">
        <p className="mx-auto max-w-[260px] text-sm font-bold text-slate-500">Escaneie o QR Code para conectar. Depois aproveite para seguir ou avaliar o estabelecimento.</p>
        <div className="mx-auto mt-4 w-fit rounded-3xl bg-slate-50 p-4"><QRCodeSVG value={wifiPayload(site)} size={190} /></div>
        <div className="mt-4 grid gap-2 text-left">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-black text-slate-400">Rede</p><p className="font-black">{site.wifi.ssid || "Rede Wi-Fi"}</p></div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><div><p className="text-xs font-black text-slate-400">Senha</p><p className="font-mono font-black">{site.wifi.password || "sem senha"}</p></div><button onClick={() => copyText(site.wifi.password, "wifi")} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><Copy className="mr-1 inline h-3 w-3" />{copied === "wifi" ? "Copiado" : "Copiar"}</button></div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-black text-slate-400">Depois de conectar</p>
          {checkinUrl ? <button onClick={() => window.open(checkinUrl, "_blank", "noopener,noreferrer")} className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"><MapPin className="mr-2 inline h-4 w-4" />{site.wifi.checkinLabel || defaultCheckinLabel}</button> : null}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {site.contact.instagram ? <button onClick={() => window.open(normalizeInstagram(site.contact.instagram), "_blank", "noopener,noreferrer")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700"><InstagramIcon className="mr-1 inline h-4 w-4" />Instagram</button> : null}
            {site.contact.facebook ? <button onClick={() => window.open(ensureUrl(site.contact.facebook), "_blank", "noopener,noreferrer")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700"><Globe2 className="mr-1 inline h-4 w-4" />Facebook</button> : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, site, children, icon }: { title: string; onClose: () => void; site: ToqySite; children: React.ReactNode; icon: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}><div className="max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-[2rem] border p-4 shadow-2xl" style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.16)", color: site.theme.text }} onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F" }}>{icon}</div><h3 className="text-xl font-black">{title}</h3></div><button onClick={onClose} className="rounded-full p-2" style={{ background: "rgba(255,255,255,.12)" }}><X className="h-5 w-5" /></button></div>{children}</div></div>;
}

export default PublicBioSite;
