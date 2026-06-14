"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarCheck,
  CreditCard,
  ExternalLink,
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
  Star,
  Wifi,
} from "lucide-react";
import type { ToqyButton, ToqyLinkType, ToqySite } from "@/lib/types";
import { buttonHref, createVCard, pixPayload, whatsappUrl, wifiPayload } from "@/lib/buttonUtils";

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
};

type Modal = "wifi" | "pix" | null;

function radiusClass(site: ToqySite) {
  if (site.theme.buttonRadius === "pill") return "rounded-full";
  if (site.theme.buttonRadius === "rounded") return "rounded-3xl";
  return "rounded-xl";
}

function logoSize(site: ToqySite) {
  if (site.profile.logoSize === "small") return "h-20 w-20";
  if (site.profile.logoSize === "large") return "h-36 w-36";
  return "h-28 w-28";
}

function logoShape(site: ToqySite) {
  if (site.profile.logoShape === "circle") return "rounded-full";
  if (site.profile.logoShape === "rounded") return "rounded-3xl";
  return "rounded-xl";
}

function backgroundStyle(site: ToqySite): React.CSSProperties {
  const plaque = site.plaqueTheme?.useSameBackground && site.plaqueTheme.backgroundImageUrl;
  const image = plaque ? site.plaqueTheme?.backgroundImageUrl : site.profile.backgroundImageUrl;
  if ((site.theme.backgroundType === "image" || plaque) && image) {
    return { backgroundColor: site.theme.background, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (site.theme.backgroundType === "solid") return { background: site.theme.background };
  return { background: `linear-gradient(160deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` };
}

function buttonStyle(site: ToqySite): React.CSSProperties {
  if (site.theme.buttonFill === "gradient") return { background: `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.secondary})`, color: site.theme.mode === "light" ? "#ffffff" : "#06111F" };
  if (site.theme.buttonFill === "glass") return { background: "rgba(255,255,255,0.12)", color: site.theme.text, borderColor: "rgba(255,255,255,0.16)" };
  return { background: site.theme.primary, color: site.theme.mode === "light" ? "#ffffff" : "#06111F" };
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}

export function PublicBioSite({ site }: { site: ToqySite }) {
  const [modal, setModal] = useState<Modal>(null);
  const [copied, setCopied] = useState("");
  const activeButtons = site.buttons.filter((button) => button.enabled);
  const activeCatalog = site.catalog.filter((item) => item.enabled);
  const vcard = useMemo(() => createVCard(site), [site]);

  async function copyText(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  function downloadVCard() {
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
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

  return (
    <div className="min-h-screen w-full" style={{ ...backgroundStyle(site), color: site.theme.text }}>
      <div className="min-h-screen w-full" style={site.theme.useBackgroundOverlay ? { background: site.theme.mode === "dark" ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.18)" } : undefined}>
        <main className="mx-auto w-full max-w-[430px] px-5 py-8">
          <section className="relative overflow-hidden rounded-[2.2rem] border p-5 text-center shadow-2xl backdrop-blur-xl" style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.14)" }}>
            <div className="absolute inset-x-10 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${site.theme.primary}, transparent)` }} />
            <div className="mx-auto flex flex-col items-center">
              <div className={`${logoSize(site)} ${logoShape(site)} flex items-center justify-center overflow-hidden border-4 shadow-2xl`} style={{ borderColor: site.theme.primary, background: `linear-gradient(135deg, ${site.theme.primary}, ${site.theme.secondary})` }}>
                {site.profile.logoUrl || site.profile.profileImageUrl ? (
                  <img src={site.profile.logoUrl || site.profile.profileImageUrl} alt={site.profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-black" style={{ color: site.theme.mode === "light" ? "#fff" : "#06111F" }}>{getInitials(site.profile.name)}</span>
                )}
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight">{site.profile.name}</h1>
              <p className="mt-2 text-sm font-bold" style={{ color: site.theme.accent }}>{site.profile.title}</p>
              <p className="mt-3 max-w-[330px] text-sm leading-relaxed" style={{ color: site.theme.muted }}>{site.profile.description}</p>
              {site.profile.location ? <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold" style={{ color: site.theme.muted }}><MapPin className="h-4 w-4" />{site.profile.location}</p> : null}
            </div>
          </section>

          <section className="mt-5 grid grid-cols-3 gap-3">
            <button type="button" onClick={downloadVCard} className={`${radiusClass(site)} flex min-h-20 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black backdrop-blur`} style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.14)" }}><Save className="h-5 w-5" style={{ color: site.theme.primary }} />Salvar contato</button>
            {site.contact.whatsapp ? <button type="button" onClick={() => window.open(whatsappUrl(site), "_blank")} className={`${radiusClass(site)} flex min-h-20 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black backdrop-blur`} style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.14)" }}><MessageCircle className="h-5 w-5" style={{ color: site.theme.primary }} />WhatsApp</button> : null}
            {site.links.googleMapsUrl ? <button type="button" onClick={() => window.open(site.links.googleMapsUrl, "_blank")} className={`${radiusClass(site)} flex min-h-20 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black backdrop-blur`} style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.14)" }}><MapPin className="h-5 w-5" style={{ color: site.theme.primary }} />Rota</button> : null}
          </section>

          <section className={site.theme.buttonStyle === "icon" ? "mt-5 grid grid-cols-3 gap-3" : "mt-5 space-y-3"}>
            {activeButtons.map((button) => {
              if (site.theme.buttonStyle === "icon") {
                return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex min-h-24 flex-col items-center justify-center gap-2 border p-3 text-center text-xs font-black transition active:scale-[0.98]`} style={buttonStyle(site)}><ButtonIcon type={button.type} /><span>{button.label}</span></button>;
              }
              return <button key={button.id} type="button" onClick={() => handleButton(button)} className={`${radiusClass(site)} flex w-full items-center justify-between gap-3 border px-5 py-4 text-left font-black shadow-lg transition active:scale-[0.98]`} style={buttonStyle(site)}><span className="inline-flex items-center gap-3"><ButtonIcon type={button.type} />{button.label}</span><ExternalLink className="h-4 w-4 opacity-70" /></button>;
            })}
          </section>

          {activeCatalog.length ? (
            <section id="catalogo-toqy" className="mt-8 scroll-mt-8">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: site.theme.accent }}>Catálogo</p><h2 className="mt-1 text-2xl font-black">Produtos e serviços</h2></div>
              </div>
              <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3">
                {activeCatalog.map((item) => (
                  <article key={item.id} className="min-w-[270px] snap-start overflow-hidden rounded-[1.6rem] border shadow-xl backdrop-blur" style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.14)" }}>
                    <div className={item.imageLayout === "horizontal" ? "h-36" : "h-56"} style={{ background: `linear-gradient(135deg, ${site.theme.primary}33, ${site.theme.secondary}44)` }}>
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileText className="h-10 w-10 opacity-60" /></div>}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-black">{item.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: site.theme.muted }}>{item.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {item.price ? <span className="font-black" style={{ color: site.theme.accent }}>{item.price}</span> : <span />}
                        <button type="button" onClick={() => window.open(item.actionUrl || whatsappUrl(site), "_blank")} className="rounded-full px-4 py-2 text-xs font-black" style={{ background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F" }}>{item.actionLabel || "Ver"}</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="mt-8 pb-4 text-center text-xs font-bold" style={{ color: site.theme.muted }}>Criado com <span style={{ color: site.theme.primary }}>TOQY</span> por Leonardo Marusso</footer>
        </main>
      </div>

      {modal === "wifi" ? <ModalShell title="Wi-Fi" onClose={() => setModal(null)} site={site}><div className="rounded-3xl bg-white p-4 text-center text-slate-950"><QRCodeSVG value={wifiPayload(site)} size={190} className="mx-auto" /><p className="mt-4 font-black">{site.wifi.ssid || "Rede Wi-Fi"}</p><p className="mt-1 text-sm text-slate-500">Senha: {site.wifi.password || "sem senha"}</p><button onClick={() => copyText(site.wifi.password, "wifi")} className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{copied === "wifi" ? "Copiado" : "Copiar senha"}</button></div></ModalShell> : null}
      {modal === "pix" ? <ModalShell title="Pix" onClose={() => setModal(null)} site={site}><div className="rounded-3xl bg-white p-4 text-center text-slate-950"><QRCodeSVG value={pixPayload(site)} size={190} className="mx-auto" /><p className="mt-4 font-black">{site.pix.receiver || site.profile.name}</p><p className="mt-1 break-all text-sm text-slate-500">{site.pix.key || "Configure a chave Pix"}</p><div className="mt-4 grid gap-2"><button onClick={() => copyText(site.pix.key, "pix")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{copied === "pix" ? "Copiado" : "Copiar chave Pix"}</button>{site.pix.whatsappProofNumber ? <button onClick={() => window.open(`https://wa.me/${site.pix.whatsappProofNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Já realizei o pagamento via Pix e vou enviar o comprovante.")}`, "_blank")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Enviar comprovante</button> : null}</div></div></ModalShell> : null}
    </div>
  );
}

function ModalShell({ title, onClose, site, children }: { title: string; onClose: () => void; site: ToqySite; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-[420px] rounded-[2rem] border p-4 shadow-2xl" style={{ background: site.theme.card, borderColor: "rgba(255,255,255,0.16)", color: site.theme.text }} onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black">{title}</h3><button onClick={onClose} className="rounded-full px-3 py-1 text-sm font-black" style={{ background: site.theme.primary, color: site.theme.mode === "light" ? "#fff" : "#06111F" }}>Fechar</button></div>{children}</div></div>;
}

export default PublicBioSite;
