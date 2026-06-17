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
  Camera,
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

const iconByType: Partial<Record<ToqyLinkType, React.ComponentType<{ className?: string }>>> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  phone: Phone,
  maps: MapPin,
  wifi: Wifi,
  pix: CreditCard,
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
  facebook: Camera,
  linkedin: Globe2,
  youtube: Globe2,
  tiktok: Globe2,
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
    return {
      backgroundColor: site.theme.background,
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.28)), url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    };
  }
  if (site.theme.backgroundType === "solid") return { background: site.theme.background };
  return { background: `radial-gradient(circle at 50% 0%, ${site.theme.primary}33, transparent 34%), linear-gradient(160deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` };
}

function glassCard(site: ToqySite): React.CSSProperties {
  const isLight = site.theme.mode === "light";
  return {
    background: isLight ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.12)",
    borderColor: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.18)",
    boxShadow: isLight ? "0 18px 45px rgba(15,23,42,.10)" : "0 20px 70px rgba(0,0,0,.20)",
  };
}

function buttonStyle(site: ToqySite): React.CSSProperties {
  const text = site.theme.mode === "light" ? "#ffffff" : "#F8FAFC";
  if (site.theme.buttonFill === "gradient") return { background: `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.secondary})`, color: text, borderColor: "rgba(255,255,255,0.18)" };
  if (site.theme.buttonFill === "glass") return { background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.13)", color: site.theme.text, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.18)" };
  return { background: site.theme.primary, color: text, borderColor: "rgba(255,255,255,0.18)" };
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
      await navigator.share({ title: site.profile.name, text: site.profile.description, url });
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

  const ButtonIcon = ({ type }: { type: ToqyLinkType }) => {
    const Icon = iconByType[type] ?? LinkIcon;
    return <Icon className="h-5 w-5 shrink-0" />;
  };

  const socialButtons = activeButtons.filter((button) => ["whatsapp", "instagram", "email", "linkedin", "facebook", "phone"].includes(button.type));
  const mainButtons = activeButtons.filter((button) => !["whatsapp", "instagram", "email", "linkedin", "facebook", "phone"].includes(button.type));

  return (
    <div className="min-h-screen w-full" style={{ ...backgroundStyle(site), color: site.theme.text }}>
      <div className="min-h-screen w-full" style={site.theme.useBackgroundOverlay ? { background: site.theme.mode === "dark" ? "rgba(0,0,0,0.38)" : "rgba(255,255,255,0.12)" } : undefined}>
        <main className="mx-auto w-full max-w-[430px] px-4 py-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button type="button" onClick={() => copyText(window.location.href, "qr")} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl" style={glassCard(site)}><QrCode className="h-4 w-4" />QR Code</button>
            <button type="button" onClick={shareSite} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black backdrop-blur-xl" style={glassCard(site)}><Share2 className="h-4 w-4" />{copied === "share" ? "Copiado" : "Compartilhar"}</button>
          </div>

          <header className="text-center">
            <div className={`${logoSize(site)} ${logoShape(site)} mx-auto flex items-center justify-center overflow-hidden border shadow-2xl`} style={{ borderColor: `${site.theme.primary}88`, background: (site.profile.logoUrl || site.profile.profileImageUrl) ? "transparent" : `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.secondary})` }}>
              {site.profile.logoUrl || site.profile.profileImageUrl ? (
                <img src={site.profile.logoUrl || site.profile.profileImageUrl} alt={site.profile.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-white">{getInitials(site.profile.name)}</span>
              )}
            </div>
          <h1 className="mt-5 text-2xl font-black leading-tight drop-shadow-sm" style={{ textShadow: site.theme.mode === "light" ? "none" : "0 0 10px rgba(0,0,0,0.5)" }}>{site.profile.name}</h1>
            {site.profile.title ? <p className="mt-1 text-base font-medium" style={{ color: site.theme.muted }}>{site.profile.title}</p> : null}
            {site.profile.logoUrl && site.profile.profileImageUrl && site.profile.logoUrl !== site.profile.profileImageUrl ? <img src={site.profile.logoUrl} alt={`${site.profile.name} logo`} className="mx-auto mt-4 max-h-16 max-w-[220px] object-contain" /> : null}
            {site.profile.description ? <p className="mx-auto mt-4 max-w-[350px] text-sm leading-relaxed" style={{ color: site.theme.muted }}>{site.profile.description}</p> : null}
          </header>

          <section className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={downloadVCard} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={glassCard(site)}><Save className="h-4 w-4" />Salvar Contato</button>
            {site.contact.phone ? <button type="button" onClick={() => window.open(`tel:${site.contact.phone.replace(/\D/g, "")}`)} className={`${radiusClass(site)} flex items-center justify-center gap-2 border px-4 py-3 text-xs font-black backdrop-blur-xl`} style={glassCard(site)}><Phone className="h-4 w-4" />Ligar</button> : null}
          </section>

          {socialButtons.length ? (
            <section className="mt-4 flex items-center justify-between gap-2">
              <ChevronLeft className="h-5 w-5 opacity-80" />
              <div className="flex flex-1 justify-center gap-3">
                {socialButtons.map((button) => <button key={button.id} type="button" onClick={() => handleButton(button)} className="flex h-14 w-14 items-center justify-center rounded-2xl border text-white shadow-lg backdrop-blur-xl transition active:scale-95" style={{ ...glassCard(site), color: site.theme.text }}><ButtonIcon type={button.type} /></button>)}
              </div>
              <ChevronRight className="h-5 w-5 opacity-80" />
            </section>
          ) : null}

          <section className={site.theme.buttonStyle === "icon" ? "mt-5 grid grid-cols-3 gap-3" : "mt-5 space-y-3"}>
            {mainButtons.map((button) => {
              if (site.theme.buttonStyle === "icon") {
                return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex min-h-24 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black shadow-lg transition active:scale-[0.98]`} style={buttonStyle(site)}><ButtonIcon type={button.type} /><span>{button.label}</span></button>;
              }
              return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex w-full items-center justify-center gap-3 border px-5 py-4 text-center font-black shadow-lg backdrop-blur-xl transition active:scale-[0.98]`} style={buttonStyle(site)}><ButtonIcon type={button.type} /><span>{button.label}</span></button>;
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

          <footer className="mt-8 pb-4 text-center text-xs font-bold leading-relaxed" style={{ color: site.theme.muted }}>
            <p>© 2026 {site.profile.name}. Todos os direitos reservados.</p>
            <p>
              Criado com{" "}
              <a href="https://toqy.com.br" target="_blank" rel="noreferrer" className="font-black underline-offset-4 hover:underline" style={{ color: site.theme.primary }}>
                TOQY
              </a>
            </p>
          </footer>
        </main>
      </div>

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

  // Suporte a múltiplos layouts
  const layouts: CatalogLayout[] = site.catalogLayouts?.length ? site.catalogLayouts : [layout];

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
        {layouts.length > 1 ? (
          // Múltiplos layouts: cada um em sequência com sub-título
          <div className="space-y-8">
            {layouts.map((l) => (
              <div key={l}>
                <p className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: site.theme.muted }}>{LAYOUT_LABELS[l]}</p>
                {renderLayout(l, filteredItems)}
              </div>
            ))}
          </div>
        ) : (
          renderLayout(layouts[0], filteredItems)
        )}
      </div>

      {whatsapp ? (
        <div className="mt-5 rounded-[1.5rem] border p-4 text-center backdrop-blur-xl" style={{ background: site.theme.mode === "light" ? "rgba(255,255,255,0.66)" : "rgba(255,255,255,0.08)", borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.16)" }}>
          <p className="text-sm font-black">{site.catalogWaLabel || "Não encontrou o que procura?"}</p>
          <button type="button" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black" style={{ background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F" }}><MessageCircle className="h-4 w-4" />Fale com a gente no WhatsApp</button>
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
    <article className={`${width} snap-start overflow-hidden rounded-[1.6rem] border shadow-xl backdrop-blur`} style={{ background: site.theme.card, borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.14)" }}>
      <div className={imageHeight} style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}>
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="h-10 w-10 opacity-60" /></div>}
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        <h3 className={compact ? "text-sm font-black leading-tight" : "text-lg font-black"}>{item.name}</h3>
        <p className={compact ? "mt-1 line-clamp-3 text-xs leading-relaxed" : "mt-2 text-sm leading-relaxed"} style={{ color: site.theme.muted }}>{item.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          {item.price ? <span className={compact ? "text-xs font-black" : "font-black"} style={{ color: site.theme.accent }}>{item.price}</span> : <span />}
          <div className="flex items-center gap-2">
            {whatsapp ? <button type="button" aria-label="Falar no WhatsApp" onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: site.theme.mode === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.18)", color: site.theme.text }}><MessageCircle className="h-4 w-4" /></button> : null}
            <button type="button" onClick={() => { const href = item.actionUrl ? ensureUrl(item.actionUrl) : whatsapp; if (href) window.open(href, "_blank", "noopener,noreferrer"); }} className="rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F" }}>{item.actionLabel || "Ver"}</button>
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
            {site.contact.instagram ? <button onClick={() => window.open(normalizeInstagram(site.contact.instagram), "_blank", "noopener,noreferrer")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700"><Camera className="mr-1 inline h-4 w-4" />Instagram</button> : null}
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
