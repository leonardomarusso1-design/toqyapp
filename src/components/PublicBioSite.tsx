"use client";

import { useMemo, useState } from "react";
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

// SVGs reais das marcas
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.84a8.16 8.16 0 004.77 1.52V6.91a4.85 4.85 0 01-1-.22z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const PhoneIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.3 2.28a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const MapPinIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
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

function backgroundStyle(site: ToqySite): React.CSSProperties {
  const plaque = site.plaqueTheme?.useSameBackground && site.plaqueTheme.backgroundImageUrl;
  const image = plaque ? site.plaqueTheme?.backgroundImageUrl : site.profile.backgroundImageUrl;
  if ((site.theme.backgroundType === "image" || plaque) && image) {
    const isDark = site.theme.mode === "dark";
    const overlay = isDark
      ? "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.55) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.30) 100%)";
    return {
      backgroundColor: site.theme.background,
      backgroundImage: `${overlay}, url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center top",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "scroll",
    };
  }
  if (site.theme.backgroundType === "solid") return { background: site.theme.background };
  return { background: `radial-gradient(circle at 50% 0%, ${site.theme.primary}33, transparent 34%), linear-gradient(160deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` };
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

export function PublicBioSite({ site }: { site: ToqySite }) {
  const [modal, setModal] = useState<Modal>(null);
  const [qrModal, setQrModal] = useState(false);

  // Helper: retorna cor granular com fallback para tema global
  const col = (key: keyof NonNullable<typeof site.theme.colors>, fallback: string) =>
    site.theme.colors?.[key] ?? fallback;
  const [copied, setCopied] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>();
  const activeButtons = site.buttons.filter((button) => button.enabled);
  const activeCatalog = site.catalog.filter((item) => item.enabled);
  const catalogLayout: CatalogLayout = site.catalogLayout ?? "carousel";
  const vcard = useMemo(() => createVCard(site), [site]);

  async function copyText(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function shareSite() {
    const url = typeof window !== "undefined" ? window.location.href : "";
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
    const pageUrl = typeof window !== "undefined" ? window.location.href : site.contact.website;
    const contactCard = site.contact.website || !pageUrl ? vcard : vcard.replace("END:VCARD", `URL:${pageUrl}\nEND:VCARD`);
    const blob = new Blob([contactCard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${site.slug || "toqy"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleButton(button: ToqyButton) {
    if (button.type === "wifi") return setModal("wifi");
    if (button.type === "pix" || button.type === "pixHub") return setModal("pix");
    if (button.type === "catalog") {
      document.getElementById("catalogo-toqy")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const href = buttonHref(site, button);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  }

  const ButtonIcon = ({ type, color }: { type: ToqyLinkType; color?: string }) => {
    const Icon = iconByType[type] ?? LinkIcon;
    return <Icon className="h-5 w-5 shrink-0" style={color ? { color } : undefined} />;
  };

  const SOCIAL_TYPES = ["whatsapp", "instagram", "facebook", "tiktok", "linkedin", "youtube", "email"];
  // displayAs="icon" força ícone, displayAs="button" força botão grande, undefined = automático por tipo
  const socialButtons = activeButtons.filter((b) =>
    b.displayAs === "icon" || (!b.displayAs && SOCIAL_TYPES.includes(b.type))
  ).filter(b => b.displayAs !== "button");
  const wifiInline = site.wifi?.enabled && site.wifi.ssid && site.wifi.showInline !== false;
  const mainButtons = activeButtons.filter((b) =>
    b.displayAs === "button" || (!b.displayAs && !SOCIAL_TYPES.includes(b.type) && b.type !== "phone" && !(wifiInline && b.type === "wifi"))
  );

  return (
    <div className="min-h-screen w-full" style={{ ...backgroundStyle(site), color: site.theme.text }}>
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
          <h1 className="mt-5 text-2xl font-black leading-tight drop-shadow-sm" style={{ color: col("name", site.theme.text), textShadow: site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.name}</h1>
            {site.profile.title ? <p className="mt-1 text-base font-medium" style={{ color: col("title", site.theme.muted) }}>{site.profile.title}</p> : null}
            {site.profile.location ? (
              <div className="mt-2 flex flex-col items-center gap-0.5">
              <div className="flex items-start justify-center gap-1">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: col("location", site.theme.muted) }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <p className="text-center text-sm font-semibold leading-snug" style={{ color: col("location", site.theme.muted) }}>{site.profile.location}</p>
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
            <button type="button" onClick={downloadVCard} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={{ ...glassCard(site), color: col("saveContactText", site.theme.text) }}><Save className="h-4 w-4" />Salvar Contato</button>
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
                const bg = useGlass
                  ? (site.theme.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")
                  : (brandColor[button.type] ?? site.theme.primary);
                const iconColor = useGlass ? site.theme.text : "#fff";
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
              <button type="button" onClick={() => document.getElementById("catalogo-toqy")?.scrollIntoView({ behavior: "smooth" })} className="mt-3 rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.text, color: site.theme.background }}>{site.promoCard?.buttonLabel || "Ver mais"}</button>
            </section>
          ) : null}

          {activeCatalog.length ? <CatalogSection site={site} items={activeCatalog} layout={catalogLayout} /> : null}

          <footer className="mt-8 pb-6 text-center text-xs font-bold leading-relaxed" style={{ color: site.theme.muted }}>
            <p style={{ color: site.theme.muted }}>© {new Date().getFullYear()} {site.profile.name}. Todos os direitos reservados.</p>
            <p className="mt-1" style={{ color: site.theme.muted }}>
              Criado com{" "}
              <a href="https://toqy.com.br" target="_blank" rel="noreferrer" className="font-black underline-offset-4 hover:underline" style={{ color: site.theme.primary }}>
                TOQY
              </a>
            </p>
          </footer>
        </main>
      </div>

      {qrModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setQrModal(false)}>
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="mb-4 text-sm font-black text-slate-500 uppercase tracking-widest">QR Code</p>
            <p className="mb-5 font-black text-slate-900 text-lg">{site.profile.name}</p>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 inline-block">
              <QRCodeSVG value={typeof window !== "undefined" ? window.location.href : ""} size={200} />
            </div>
            <p className="mt-4 text-xs text-slate-400 break-all max-w-[240px] mx-auto">{typeof window !== "undefined" ? window.location.href : ""}</p>
            <button onClick={() => { copyText(typeof window !== "undefined" ? window.location.href : "", "qr"); }} className="mt-4 block w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white">
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

function CatalogSection({ site, items, layout }: { site: ToqySite; items: CatalogItem[]; layout: CatalogLayout }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category?.trim() || "Destaques"))), [items]);
  const filteredItems = activeCategory === "Todas" ? items : items.filter((item) => (item.category?.trim() || "Destaques") === activeCategory);
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
    const padrao = filteredItems.filter(i => !i.displaySection || i.displaySection === "padrao");
    return { destaques, carrossel, grade, lista, padrao };
  }, [filteredItems]);

  const hasCustomSections = filteredItems.some(i => i.displaySection && i.displaySection !== "padrao");

  function renderLayout(l: CatalogLayout, items2: CatalogItem[]) {
    if (l === "grouped" || l === "category-carousel") {
      return (
        <div className="space-y-7">
          {uniqueGroups(items2).map(([group, groupItems]) => (
            <div key={group}>
              <h3 className="mb-3 text-base font-black" style={{ color: site.theme.muted }}>{group}</h3>
              <CatalogScroller site={site} items={groupItems} />
            </div>
          ))}
        </div>
      );
    }
    if (l === "grid") return <div className="grid grid-cols-2 gap-3">{items2.map((item) => <CatalogCard key={item.id} site={site} item={item} compact />)}</div>;
    if (l === "stack") return <div className="space-y-4">{items2.map((item) => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>;
    return <CatalogScroller site={site} items={items2} />;
  }

  const LAYOUT_LABELS: Record<CatalogLayout, string> = {
    carousel: "Destaques",
    grid: "Grade",
    stack: "Lista completa",
    grouped: "Por categoria",
    "category-carousel": "Por categoria",
  };

  return (
    <section id="catalogo-toqy" className="mt-8 scroll-mt-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: site.theme.accent }}>Catálogo</p>
      <h2 className="mt-1 text-2xl font-black">{site.catalogTitle || "Produtos e serviços"}</h2>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: site.theme.muted }}>{site.catalogSubtitle || "Selecionados para você. Toque em um item para pedir ou agendar."}</p>

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
            {itemsBySection.destaques.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.accent }}>Destaques</p>
                <div className="space-y-4">{itemsBySection.destaques.map(item => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>
              </div>
            )}
            {itemsBySection.carrossel.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{itemsBySection.carrossel[0].category || "Carrossel"}</p>
                <CatalogScroller site={site} items={itemsBySection.carrossel} />
              </div>
            )}
            {itemsBySection.grade.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{itemsBySection.grade[0].category || "Grade"}</p>
                <div className="grid grid-cols-2 gap-3">{itemsBySection.grade.map(item => <CatalogCard key={item.id} site={site} item={item} compact />)}</div>
              </div>
            )}
            {itemsBySection.lista.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{itemsBySection.lista[0].category || "Lista"}</p>
                <div className="space-y-4">{itemsBySection.lista.map(item => <CatalogCard key={item.id} site={site} item={item} stacked />)}</div>
              </div>
            )}
            {itemsBySection.padrao.length > 0 && (
              <div>
                <CatalogScroller site={site} items={itemsBySection.padrao} />
              </div>
            )}
          </div>
        ) : (
          // Modo layouts gerais
          (() => {
            const layouts: CatalogLayout[] = site.catalogLayouts?.length ? site.catalogLayouts : [layout];
            if (layouts.length > 1) {
              return (
                <div className="space-y-8">
                  {layouts.map((l) => (
                    <div key={l}>
                      <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{LAYOUT_LABELS[l]}</p>
                      {renderLayout(l, filteredItems)}
                    </div>
                  ))}
                </div>
              );
            }
            return renderLayout(layouts[0], filteredItems);
          })()
        )}
      </div>

      {(whatsapp || site.catalogWaLabel) ? (
        <div className="mt-5 rounded-[1.5rem] border p-4 text-center backdrop-blur-xl" style={{ background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.08)", borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.16)" }}>
          <p className="text-sm font-black" style={{ color: site.theme.text }}>{site.catalogWaLabel || "Não encontrou o que procura?"}</p>
          {whatsapp ? <button type="button" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black" style={{ background: site.theme.primary, color: "#fff" }}><WhatsAppIcon className="h-4 w-4" />Fale com a gente no WhatsApp</button> : null}
        </div>
      ) : null}
    </section>
  );
}

function CatalogScroller({ site, items }: { site: ToqySite; items: CatalogItem[] }) {
  return <div className="flex snap-x gap-4 overflow-x-auto pb-3">{items.map((item) => <CatalogCard key={item.id} site={site} item={item} />)}</div>;
}

function CatalogCard({ site, item, compact = false, stacked = false }: { site: ToqySite; item: CatalogItem; compact?: boolean; stacked?: boolean }) {
  const width = stacked ? "w-full" : compact ? "w-full" : "min-w-[275px]";
  const imageHeight = compact ? "h-28" : item.imageLayout === "horizontal" ? "h-36" : "h-52";
  const whatsapp = whatsappUrl(site);
  return (
    <article className={`${width} snap-start overflow-hidden rounded-[1.6rem] border shadow-xl backdrop-blur`} style={{ background: site.theme.colors?.catalogItemBg ?? site.theme.card, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)" }}>
      <div className={imageHeight} style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}>
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="h-10 w-10 opacity-60" /></div>}
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        {item.highlight ? <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-black" style={{ background: site.theme.colors?.catalogItemHighlight ? site.theme.colors.catalogItemHighlight + "22" : "#fef3c7", color: site.theme.colors?.catalogItemHighlight ?? "#b45309" }}>{item.highlight}</span> : null}
        <h3 className={compact ? "text-sm font-black leading-tight" : "text-lg font-black"} style={{ color: site.theme.colors?.catalogItemName ?? site.theme.text }}>{item.name}</h3>
        <p className={compact ? "mt-1 line-clamp-3 text-xs leading-relaxed" : "mt-2 text-sm leading-relaxed"} style={{ color: site.theme.colors?.catalogItemDesc ?? site.theme.muted }}>{item.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          {item.price ? <span className={compact ? "text-xs font-black" : "font-black"} style={{ color: site.theme.colors?.catalogItemPrice ?? site.theme.accent }}>{item.price}</span> : <span />}
          <div className="flex items-center gap-2">
            {whatsapp && site.showCatalogWhatsapp !== false ? <button type="button" aria-label="Falar no WhatsApp" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.18)", color: site.theme.text }}><WhatsAppIcon className="h-4 w-4" /></button> : null}
            <button type="button" onClick={() => { const href = item.actionUrl ? ensureUrl(item.actionUrl) : whatsapp; if (href) window.open(href, "_blank", "noopener,noreferrer"); }} className="rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.colors?.catalogActionBg ?? site.theme.primary, color: site.theme.colors?.catalogActionText ?? (site.theme.mode === "light" ? "#fff" : "#06111F") }}>{item.actionLabel || "Ver"}</button>
          </div>
        </div>
      </div>
    </article>
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
