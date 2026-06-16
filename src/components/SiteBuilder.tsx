"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { CatalogItem, CatalogLayout, Segment, ThemePreset, ToqySite } from "@/lib/types";
import { applySegmentTemplate, getSegmentTemplate, segmentOptions } from "@/lib/segmentTemplates";
import { createEditUrl, createPublicUrl, generateSlug } from "@/lib/dataProvider";
import { validateSite } from "@/lib/validation";
import { ImageGuidelineHint } from "./ImageGuidelineHint";
import { ImageUploadField } from "./ImageUploadField";
import { LiveBioSitePreview } from "./LiveBioSitePreview";
import { ThemePresetPicker } from "./ThemePresetPicker";
import { ButtonEditor } from "./ButtonEditor";
import { generateId } from "@/lib/security";
import { syncModulesFromButtons } from "@/lib/buttonSync";

type Props = { mode: "create" | "edit"; initialSite: ToqySite; onSave: (site: ToqySite) => void };

const steps = ["Modelo", "Perfil", "Visual", "Links e Botões", "Pix e Wi-Fi", "Catálogo", "Salvar"];
const field = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100";
const label = "text-sm font-black text-slate-800";

function Section({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">{children}</section>;
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">{children}</p>;
}

function updateCatalogItem(items: CatalogItem[], index: number, patch: Partial<CatalogItem>) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
}

export function SiteBuilder({ mode, initialSite, onSave }: Props) {
  const [site, setSite] = useState<ToqySite>({ ...initialSite, catalogLayout: initialSite.catalogLayout ?? "carousel" });
  const [step, setStep] = useState(0);
  const [advancedColors, setAdvancedColors] = useState(false);
  const [saved, setSaved] = useState<ToqySite | null>(null);
  const [copied, setCopied] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const publicLink = createPublicUrl(site.slug);
  const editLink = createEditUrl(site.slug);
  const selectedTemplate = getSegmentTemplate(site.segment);

  function update(next: ToqySite | ((current: ToqySite) => ToqySite)) {
    setSite((current) => {
      const value = typeof next === "function" ? next(current) : next;
      return { ...value, catalogLayout: value.catalogLayout ?? "carousel", updatedAt: new Date().toISOString() };
    });
  }

  function setProfile(patch: Partial<ToqySite["profile"]>) { update((s) => ({ ...s, profile: { ...s.profile, ...patch } })); }
  function setContact(patch: Partial<ToqySite["contact"]>) { update((s) => ({ ...s, contact: { ...s.contact, ...patch } })); }
  function setLinks(patch: Partial<ToqySite["links"]>) { update((s) => ({ ...s, links: { ...s.links, ...patch } })); }
  function setTheme(patch: Partial<ToqySite["theme"]>) { update((s) => ({ ...s, theme: { ...s.theme, ...patch } })); }

  function selectTheme(preset: ThemePreset) {
    update((s) => ({
      ...s,
      themePresetId: preset.id,
      theme: {
        ...s.theme,
        mode: preset.mode,
        background: preset.background,
        gradientFrom: preset.gradientFrom,
        gradientTo: preset.gradientTo,
        card: preset.card,
        text: preset.text,
        muted: preset.muted,
        primary: preset.primary,
        secondary: preset.secondary,
        accent: preset.accent,
      },
    }));
  }

  function save() {
    const siteToValidate = syncModulesFromButtons({ ...site, slug: generateSlug(site.slug || site.profile.name), status: "active" });
    const result = validateSite(siteToValidate);
    if (!result.ok) { setErrors(result.errors); setStep(steps.length - 1); return; }
    setErrors([]);
    onSave(siteToValidate);
    setSite(siteToValidate);
    setSaved(siteToValidate);
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  const body = (() => {
    if (step === 0) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-slate-950">Modelo</h2>
          <p className="mt-1 text-sm text-slate-500">Escolha o segmento e aplique um template realmente diferente: cores, botões, catálogo, categorias e layout.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label><span className={label}>Segmento</span><select className={field} value={site.segment} onChange={(e) => update((s) => ({ ...s, segment: e.target.value as Segment }))}>{segmentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span className={label}>Nome do negócio</span><input className={field} value={site.profile.name} onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, name: e.target.value }, slug: s.slug === "novo-negocio" || !s.slug ? generateSlug(e.target.value) : s.slug }))} /></label>
            <label><span className={label}>Link da página</span><input className={field} value={site.slug} onChange={(e) => update((s) => ({ ...s, slug: generateSlug(e.target.value) }))} /></label>
          </div>
          <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="font-black text-emerald-950">{selectedTemplate.templateName}</p>
            <p className="mt-1 text-sm text-emerald-800">{selectedTemplate.description}</p>
            <p className="mt-2 text-xs font-bold text-emerald-700">Layout de catálogo sugerido: {selectedTemplate.catalogLayout ?? "carousel"}</p>
            <button type="button" onClick={() => update((s) => applySegmentTemplate(s, site.segment))} className="mt-4 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">Aplicar template deste segmento</button>
          </div>
        </Section>
      );
    }

    if (step === 1) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-slate-950">Perfil</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ImageUploadField label="Foto de perfil" value={site.profile.profileImageUrl} onChange={(url) => setProfile({ profileImageUrl: url })} />
            <div><ImageUploadField label="Logo" value={site.profile.logoUrl} onChange={(url) => setProfile({ logoUrl: url })} /><ImageGuidelineHint type="logo" /></div>
            <label><span className={label}>Tamanho da logo</span><select className={field} value={site.profile.logoSize} onChange={(e) => setProfile({ logoSize: e.target.value as ToqySite["profile"]["logoSize"] })}><option value="small">Pequena</option><option value="medium">Média</option><option value="large">Grande</option></select></label>
            <label><span className={label}>Formato da logo</span><select className={field} value={site.profile.logoShape} onChange={(e) => setProfile({ logoShape: e.target.value as ToqySite["profile"]["logoShape"] })}><option value="circle">Redonda</option><option value="rounded">Arredondada</option><option value="square">Quadrada</option></select></label>
            <label><span className={label}>Título/subtítulo</span><input className={field} value={site.profile.title ?? ""} onChange={(e) => setProfile({ title: e.target.value })} /></label>
            <label><span className={label}>Localização</span><input className={field} value={site.profile.location} onChange={(e) => setProfile({ location: e.target.value })} /></label>
            <label className="md:col-span-2"><span className={label}>Descrição</span><textarea className={field} rows={3} value={site.profile.description} onChange={(e) => setProfile({ description: e.target.value })} /></label>
            <label><span className={label}>WhatsApp</span><input className={field} value={site.contact.whatsapp} onChange={(e) => setContact({ whatsapp: e.target.value })} /></label>
            <label><span className={label}>Telefone</span><input className={field} value={site.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} /></label>
            <label><span className={label}>Instagram</span><input className={field} value={site.contact.instagram ?? ""} onChange={(e) => setContact({ instagram: e.target.value })} /></label>
            <label><span className={label}>Facebook</span><input className={field} value={site.contact.facebook ?? ""} onChange={(e) => setContact({ facebook: e.target.value })} /></label>
            <label><span className={label}>E-mail</span><input className={field} value={site.contact.email ?? ""} onChange={(e) => setContact({ email: e.target.value })} /></label>
            <label><span className={label}>Site</span><input className={field} value={site.contact.website ?? ""} onChange={(e) => setContact({ website: e.target.value })} /></label>
          </div>
        </Section>
      );
    }

    if (step === 2) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-slate-950">Visual</h2>
          <p className="mt-1 text-sm text-slate-500">Paletas, fundo da plaquinha e botões premium inspirados no modelo enviado.</p>
          <div className="mt-5"><ThemePresetPicker selectedPresetId={site.themePresetId} onSelect={selectTheme} /></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label><span className={label}>Tipo de fundo</span><select className={field} value={site.theme.backgroundType} onChange={(e) => setTheme({ backgroundType: e.target.value as ToqySite["theme"]["backgroundType"] })}><option value="gradient">Gradiente</option><option value="solid">Cor sólida</option><option value="image">Imagem</option></select></label>
            <label><span className={label}>Layout dos botões</span><select className={field} value={site.theme.buttonStyle} onChange={(e) => setTheme({ buttonStyle: e.target.value as ToqySite["theme"]["buttonStyle"] })}><option value="full">Botões grandes</option><option value="icon">Grade de ícones</option></select></label>
            <label><span className={label}>Preenchimento</span><select className={field} value={site.theme.buttonFill} onChange={(e) => setTheme({ buttonFill: e.target.value as ToqySite["theme"]["buttonFill"] })}><option value="glass">Translúcido premium</option><option value="solid">Sólido</option><option value="gradient">Gradiente</option></select></label>
            <label><span className={label}>Formato</span><select className={field} value={site.theme.buttonRadius} onChange={(e) => setTheme({ buttonRadius: e.target.value as ToqySite["theme"]["buttonRadius"] })}><option value="soft">Soft</option><option value="rounded">Arredondado</option><option value="pill">Pill/cápsula</option></select></label>
            <label className="md:col-span-2"><span className={label}>Imagem de fundo</span><input className={field} value={site.profile.backgroundImageUrl ?? ""} onChange={(e) => setProfile({ backgroundImageUrl: e.target.value })} placeholder="URL da imagem de fundo" /><ImageGuidelineHint type="background" /></label>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-black text-slate-800"><input type="checkbox" checked={Boolean(site.plaqueTheme?.useSameBackground)} onChange={(e) => update((s) => ({ ...s, plaqueTheme: { ...s.plaqueTheme, useSameBackground: e.target.checked, backgroundImageUrl: s.plaqueTheme?.backgroundImageUrl ?? "", backgroundStyle: "image" } }))} />Usar o mesmo fundo/arte da plaquinha</label>
            {site.plaqueTheme?.useSameBackground ? <div className="mt-4"><input className={field} value={site.plaqueTheme.backgroundImageUrl ?? ""} onChange={(e) => update((s) => ({ ...s, plaqueTheme: { useSameBackground: true, backgroundImageUrl: e.target.value, backgroundStyle: "image" } }))} placeholder="URL da arte/fundo da plaquinha" /><ImageGuidelineHint type="plaque" /></div> : null}
          </div>
          <button type="button" onClick={() => setAdvancedColors((v) => !v)} className="mt-5 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">{advancedColors ? "Ocultar cores avançadas" : "Personalizar cores avançadas"}</button>
          {advancedColors ? <div className="mt-4 grid gap-4 md:grid-cols-3">{(["primary", "secondary", "accent", "background", "card", "text"] as const).map((key) => <label key={key}><span className={label}>{key}</span><input className={field} value={site.theme[key]} onChange={(e) => setTheme({ [key]: e.target.value } as Partial<ToqySite["theme"]>)} /></label>)}</div> : null}
        </Section>
      );
    }

    if (step === 3) return <ButtonEditor site={site} onChange={(next) => update(next)} />;

    if (step === 4) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-slate-950">Pix e Wi-Fi</h2>
          <p className="mt-1 text-sm text-slate-500">Configure Pix com comprovante e Wi-Fi com check-in/avaliação.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="font-black text-emerald-950">Pix premium</h3>
              <div className="mt-4 grid gap-4">
                <label><span className={label}>Chave Pix</span><input className={field} value={site.pix.key} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, key: e.target.value, enabled: true } }))} /></label>
                <label><span className={label}>Recebedor</span><input className={field} value={site.pix.receiver} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, receiver: e.target.value } }))} /></label>
                <label><span className={label}>Banco/observação</span><input className={field} value={site.pix.bank ?? ""} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, bank: e.target.value } }))} /></label>
                <label><span className={label}>WhatsApp para comprovante</span><input className={field} value={site.pix.whatsappProofNumber} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, whatsappProofNumber: e.target.value } }))} /></label>
                <label><span className={label}>Valores rápidos</span><input className={field} value={site.pix.quickAmounts.join(", ")} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, quickAmounts: e.target.value.split(",").map((v) => Number(v.trim())).filter(Boolean) } }))} /><Help>Exemplo: 10, 20, 50. Eles aparecem como botões rápidos no modal Pix.</Help></label>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="font-black text-emerald-950">Wi-Fi + check-in</h3>
              <div className="mt-4 grid gap-4">
                <label><span className={label}>Nome da rede Wi-Fi</span><input className={field} value={site.wifi.ssid} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, ssid: e.target.value, enabled: true } }))} /></label>
                <label><span className={label}>Senha Wi-Fi</span><input className={field} value={site.wifi.password} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, password: e.target.value } }))} /></label>
                <label><span className={label}>Segurança</span><select className={field} value={site.wifi.encryption} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, encryption: e.target.value as ToqySite["wifi"]["encryption"] } }))}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Sem senha</option></select></label>
                <label><span className={label}>Link de check-in/avaliação</span><input className={field} value={site.wifi.checkinUrl ?? ""} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, checkinUrl: e.target.value } }))} placeholder="Facebook, Google avaliação, Instagram..." /></label>
                <label><span className={label}>Texto do botão de check-in</span><input className={field} value={site.wifi.checkinLabel ?? ""} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, checkinLabel: e.target.value } }))} placeholder="Fazer check-in no Facebook" /></label>
                <label><span className={label}>Link Google avaliação</span><input className={field} value={site.links.googleReviewUrl ?? ""} onChange={(e) => setLinks({ googleReviewUrl: e.target.value })} /></label>
              </div>
            </div>
          </div>
        </Section>
      );
    }

    if (step === 5) {
      return (
        <Section>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Catálogo</h2>
              <p className="mt-1 text-sm text-slate-500">Escolha entre carrossel, grade, lista vertical ou carrosséis por categoria.</p>
            </div>
            <button type="button" onClick={() => update((s) => ({ ...s, catalog: [...s.catalog, { id: generateId("prd"), name: "Novo item", description: "Descricao do item", price: "", imageUrl: "", imageLayout: "square", category: "Destaques", enabled: true, actionLabel: "Ver detalhes", actionUrl: "" }] }))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Adicionar</button>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label><span className={label}>Como exibir no bio site</span><select className={field} value={site.catalogLayout ?? "carousel"} onChange={(e) => update((s) => ({ ...s, catalogLayout: e.target.value as CatalogLayout }))}><option value="carousel">Carrossel único</option><option value="grid">Grade 2 colunas</option><option value="stack">Imagem uma embaixo da outra</option><option value="category-carousel">Carrossel por categoria</option></select></label>
            <Help>Use “carrossel por categoria” para exemplos como: Cortes social, Cortes degradê, Barba e tratamentos.</Help>
          </div>
          <div className="mt-5 grid gap-4">
            {site.catalog.map((item, index) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label><span className={label}>Nome</span><input className={field} value={item.name} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { name: e.target.value }) }))} /></label>
                  <label><span className={label}>Categoria</span><input className={field} placeholder="Ex: Cortes social" value={item.category ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { category: e.target.value }) }))} /></label>
                  <label><span className={label}>Preço</span><input className={field} value={item.price ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { price: e.target.value }) }))} /></label>
                  <label><span className={label}>Imagem</span><select className={field} value={item.imageLayout} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageLayout: e.target.value as typeof item.imageLayout }) }))}><option value="square">Quadrada</option><option value="horizontal">Horizontal</option></select></label>
                  <label className="md:col-span-2"><span className={label}>Descrição</span><textarea className={field} rows={2} value={item.description} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { description: e.target.value }) }))} /></label>
                </div>
                <div className="mt-3"><ImageUploadField label="Imagem do item" value={item.imageUrl} onChange={(url) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageUrl: url }) }))} /><ImageGuidelineHint type={item.imageLayout === "square" ? "productSquare" : "productHorizontal"} /></div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                  <input className={field} placeholder="Texto do botão" value={item.actionLabel ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionLabel: e.target.value }) }))} />
                  <input className={field} placeholder="Link do botão" value={item.actionUrl ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionUrl: e.target.value }) }))} />
                  <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={item.enabled} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { enabled: e.target.checked }) }))} />Ativo</label>
                  <button type="button" onClick={() => update((s) => ({ ...s, catalog: s.catalog.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-xl border border-red-200 px-3 py-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    }

    return (
      <Section>
        <h2 className="text-2xl font-black text-slate-950">{mode === "create" ? "Publicar" : "Salvar alterações"}</h2>
        <p className="mt-1 text-sm text-slate-500">Confira, salve e entregue o link junto com a chave de acesso.</p>
        {errors.length ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{errors.map((err) => <p key={err}>{err}</p>)}</div> : null}
        <button type="button" onClick={save} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white"><Save className="h-5 w-5" />Salvar e publicar</button>
        {saved ? <div className="mt-5 grid gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-black text-emerald-900">Bio site salvo com sucesso.</p><div className="w-fit rounded-2xl bg-white p-4"><QRCodeSVG value={typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink} size={180} /></div><p className="break-all text-sm text-slate-700">Link público: {publicLink}</p><p className="break-all text-sm text-slate-700">Link de edição: {editLink}</p><p className="font-mono text-lg font-black text-slate-950">Chave: {site.editKey}</p><div className="flex flex-wrap gap-3"><button type="button" onClick={() => copy(publicLink, "link")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><Copy className="h-4 w-4" />{copied === "link" ? "Copiado" : "Copiar link"}</button><button type="button" onClick={() => copy(site.editKey, "key")} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">{copied === "key" ? "Copiado" : "Copiar chave"}</button><Link href={publicLink} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Abrir bio site <ExternalLink className="h-4 w-4" /></Link></div></div> : null}
      </Section>
    );
  })();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        <div className="mb-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">TOQY Builder</p><h1 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">{mode === "create" ? "Criar bio site" : "Editar bio site"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Tudo editável com preview ao vivo. Depois entregue link, QR Code e chave para o cliente.</p></div>
            <button type="button" onClick={save} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white"><Save className="h-4 w-4" />Salvar agora</button>
          </div>
          {saved ? <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" />Salvo no navegador.</div> : null}
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">{steps.map((item, index) => <button key={item} type="button" onClick={() => setStep(index)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${index === step ? "bg-[#31c4a8] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{index + 1}. {item}</button>)}</div>
        {body}
        <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-40">Voltar</button>
          <div className="flex gap-3"><button type="button" onClick={save} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">Salvar agora</button><button type="button" onClick={() => step < steps.length - 1 ? setStep((v) => v + 1) : save()} className="rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white">{step < steps.length - 1 ? "Continuar" : "Salvar e publicar"}</button></div>
        </div>
      </div>
      <LiveBioSitePreview site={site} />
    </div>
  );
}
