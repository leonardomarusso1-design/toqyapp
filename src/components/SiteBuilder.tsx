"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, MessageCircle, Plus, Save, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { CatalogItem, CatalogLayout, Segment, ThemePreset, ToqySite } from "@/lib/types";
import { applySegmentTemplate, getSegmentTemplate, segmentOptions } from "@/lib/segmentTemplates";
import { createEditUrl, createPublicUrl, generateSlug } from "@/lib/dataProvider";
import { checkBiositeLimit } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";
import { validateSite } from "@/lib/validation";
import { ImageGuidelineHint } from "./ImageGuidelineHint";
import { ImageUploadField } from "./ImageUploadField";
import { LiveBioSitePreview } from "./LiveBioSitePreview";
import { ThemePresetPicker } from "./ThemePresetPicker";
import { ButtonEditor } from "./ButtonEditor";
import { generateId } from "@/lib/security";
import { syncModulesFromButtons } from "@/lib/buttonSync";

type Props = { mode: "create" | "edit"; initialSite: ToqySite; onSave: (site: ToqySite) => unknown | Promise<unknown> };

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
  const [saved, setSaved] = useState<ToqySite | null>(null);
  const [copied, setCopied] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [limitState, setLimitState] = useState<{ current: number; limit: number; planTier: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  async function save() {
    if (isSaving) return;

    const siteToValidate = syncModulesFromButtons({ ...site, slug: generateSlug(site.slug || site.profile.name), status: "active" });
    const result = validateSite(siteToValidate);
    if (!result.ok) {
      setErrors(result.errors);
      setStep(steps.length - 1);
      return;
    }

    if (mode === "create") {
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        const limitCheck = await checkBiositeLimit(user?.id ?? "").catch(() => ({ allowed: true, current: 0, limit: 999, planTier: "local" }));

        if (!limitCheck.allowed) {
          setLimitState({
            current: limitCheck.current,
            limit: limitCheck.limit,
            planTier: limitCheck.planTier,
          });
          setErrors([]);
          setStep(steps.length - 1);
          setIsSaving(false);
          return;
        }
      } catch {
        // Sem autenticação ou erro de rede: permite salvar no localStorage normalmente
      } finally {
        setIsSaving(false);
      }
    }

    setErrors([]);
    setLimitState(null);
    setIsSaving(true);
    try {
      await onSave(siteToValidate);
      setSite(siteToValidate);
      setSaved(siteToValidate);
    } finally {
      setIsSaving(false);
    }
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
            <label className="md:col-span-2"><span className={label}>Imagem de fundo</span><ImageUploadField label="" value={site.profile.backgroundImageUrl} onChange={(url) => setProfile({ backgroundImageUrl: url })} placeholder="URL da imagem de fundo" /><ImageGuidelineHint type="background" /></label>
          </div>

          {/* Roda de cores — sempre visível */}
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-800">Cores do tema</p>
            <p className="mt-0.5 text-xs text-slate-500">Clique na bolinha colorida para abrir a roda de cores e escolher qualquer cor.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {([
                ["primary",    "Cor principal",    "Botões e destaques"],
                ["secondary",  "Cor secundária",   "Gradiente do fundo"],
                ["accent",     "Cor de destaque",  "Preços e rótulos"],
                ["background", "Fundo",            "Cor de fundo da página"],
                ["card",       "Cards",            "Fundo dos cartões"],
                ["text",       "Texto",            "Cor do texto principal"],
              ] as const).map(([key, name, hint]) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <label className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center">
                    <span className="h-10 w-10 rounded-full border-2 border-white shadow-md ring-1 ring-slate-200 transition hover:scale-110" style={{ background: site.theme[key] }} />
                    <input
                      type="color"
                      value={site.theme[key]}
                      onChange={(e) => setTheme({ [key]: e.target.value } as Partial<ToqySite["theme"]>)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-800">{name}</p>
                    <p className="truncate text-xs text-slate-400">{hint}</p>
                    <input
                      type="text"
                      value={site.theme[key]}
                      onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setTheme({ [key]: e.target.value } as Partial<ToqySite["theme"]>); }}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 outline-none focus:border-[#31c4a8]"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-black text-slate-800"><input type="checkbox" checked={Boolean(site.plaqueTheme?.useSameBackground)} onChange={(e) => update((s) => ({ ...s, plaqueTheme: { ...s.plaqueTheme, useSameBackground: e.target.checked, backgroundImageUrl: s.plaqueTheme?.backgroundImageUrl ?? "", backgroundStyle: "image" } }))} />Usar o mesmo fundo/arte da plaquinha</label>
            {site.plaqueTheme?.useSameBackground ? <div className="mt-4"><ImageUploadField label="Arte/fundo da plaquinha" value={site.plaqueTheme.backgroundImageUrl} onChange={(url) => update((s) => ({ ...s, plaqueTheme: { useSameBackground: true, backgroundImageUrl: url, backgroundStyle: "image" } }))} placeholder="URL ou envie do dispositivo" /><ImageGuidelineHint type="plaque" /></div> : null}
          </div>
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
                <div>
                  <span className={label}>Valores rápidos do Pix</span>
                  <p className="mb-2 text-xs text-slate-500">Clique para ativar/desativar. Esses valores aparecem como botões rápidos no modal Pix.</p>
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 15, 20, 30, 50, 100, 150, 200].map((v) => {
                      const active = site.pix.quickAmounts.includes(v);
                      return (
                        <button key={v} type="button"
                          onClick={() => update((s) => ({ ...s, pix: { ...s.pix, quickAmounts: active ? s.pix.quickAmounts.filter((a) => a !== v) : [...s.pix.quickAmounts, v].sort((a, b) => a - b) } }))}
                          className={"rounded-full border px-4 py-2 text-sm font-black transition " + (active ? "border-[#31c4a8] bg-emerald-50 text-[#1f9f87]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
                          R$ {v}
                        </button>
                      );
                    })}
                  </div>
                  <input className={"mt-2 " + field} placeholder="Valor personalizado, ex: 250" type="number" min="1" onKeyDown={(e) => { if (e.key === "Enter") { const v = parseInt((e.target as HTMLInputElement).value); if (v > 0 && !site.pix.quickAmounts.includes(v)) { update((s) => ({ ...s, pix: { ...s.pix, quickAmounts: [...s.pix.quickAmounts, v].sort((a, b) => a - b) } })); (e.target as HTMLInputElement).value = ""; } } }} />
                  <p className="mt-1 text-xs text-slate-400">Digite um valor e pressione Enter para adicionar personalizado.</p>
                </div>
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
              <h2 className="text-2xl font-black text-slate-950">Catalogo</h2>
              <p className="mt-1 text-sm text-slate-500">Configure itens, layout e textos do catalogo.</p>
            </div>
            <button type="button" onClick={() => update((s) => ({ ...s, catalog: [...s.catalog, { id: generateId("prd"), name: "Novo item", description: "Descricao do item", price: "", imageUrl: "", imageLayout: "square", category: "Destaques", enabled: true, actionLabel: "Ver detalhes", actionUrl: "" }] }))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Adicionar item</button>
          </div>

          {/* Card promo editavel */}
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className={label}>Card antes do catalogo (&quot;Mais praticidade...&quot;)</span>
              <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                <input type="checkbox" checked={site.promoCard?.enabled ?? true} onChange={(e) => update((s) => ({ ...s, promoCard: { enabled: e.target.checked, title: s.promoCard?.title ?? "Mais praticidade em um so lugar", description: s.promoCard?.description ?? "Acesse contatos, Pix, Wi-Fi, catalogo, rotas e avaliacoes.", buttonLabel: s.promoCard?.buttonLabel ?? "Ver mais" } }))} />
                Exibir
              </label>
            </div>
            {(site.promoCard?.enabled ?? true) ? (
              <div className="mt-3 grid gap-3">
                <label><span className={label}>Titulo</span><input className={field} value={site.promoCard?.title ?? ""} onChange={(e) => update((s) => ({ ...s, promoCard: { ...s.promoCard, enabled: true, title: e.target.value, description: s.promoCard?.description ?? "", buttonLabel: s.promoCard?.buttonLabel ?? "Ver mais" } }))} /></label>
                <label><span className={label}>Descricao</span><input className={field} value={site.promoCard?.description ?? ""} onChange={(e) => update((s) => ({ ...s, promoCard: { ...s.promoCard, enabled: true, title: s.promoCard?.title ?? "", description: e.target.value, buttonLabel: s.promoCard?.buttonLabel ?? "Ver mais" } }))} /></label>
                <label><span className={label}>Texto do botao</span><input className={field} value={site.promoCard?.buttonLabel ?? "Ver mais"} onChange={(e) => update((s) => ({ ...s, promoCard: { ...s.promoCard, enabled: true, title: s.promoCard?.title ?? "", description: s.promoCard?.description ?? "", buttonLabel: e.target.value } }))} /></label>
              </div>
            ) : null}
          </div>

          {/* Titulo, subtitulo e CTA do catalogo */}
          <div className="mt-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <label><span className={label}>Titulo do catalogo</span><input className={field} placeholder="Produtos e servicos" value={site.catalogTitle ?? ""} onChange={(e) => update((s) => ({ ...s, catalogTitle: e.target.value }))} /></label>
            <label><span className={label}>Subtitulo</span><input className={field} placeholder="Selecionados para voce..." value={site.catalogSubtitle ?? ""} onChange={(e) => update((s) => ({ ...s, catalogSubtitle: e.target.value }))} /></label>
            <label className="md:col-span-2"><span className={label}>Texto &quot;Nao encontrou?&quot; (rodape do catalogo)</span><input className={field} placeholder="Nao encontrou o que procura?" value={site.catalogWaLabel ?? ""} onChange={(e) => update((s) => ({ ...s, catalogWaLabel: e.target.value }))} /></label>
          </div>

          {/* Layout do catalogo - multipla selecao */}
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <span className={label}>Como exibir no bio site</span>
            <p className="mb-3 mt-1 text-xs text-slate-500">Marque até 3 layouts. O bio site vai mostrar os itens em todos os layouts marcados, nessa ordem.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["carousel",          "Carrossel horizontal", "Arrasta para o lado, ideal para destaques"],
                ["grid",              "Grade 2 colunas",      "Visual de loja, dois itens por linha"],
                ["stack",             "Lista vertical",       "Uma foto grande embaixo da outra"],
                ["category-carousel", "Carrossel por categoria", "Agrupa: Cortes, Barba, Tratamentos..."],
              ] as const).map(([value, lbl2, desc]) => {
                const activeLayouts: CatalogLayout[] = site.catalogLayouts?.length ? site.catalogLayouts : [site.catalogLayout ?? "carousel"];
                const active = activeLayouts.includes(value);
                const toggle = () => {
                  const next = active
                    ? activeLayouts.filter((l) => l !== value)
                    : activeLayouts.length >= 3 ? activeLayouts : [...activeLayouts, value];
                  if (next.length === 0) return; // sempre manter pelo menos 1
                  update((s) => ({ ...s, catalogLayouts: next as CatalogLayout[], catalogLayout: next[0] }));
                };
                return (
                  <button key={value} type="button" onClick={toggle}
                    className={"flex items-start gap-3 rounded-2xl border p-3 text-left transition " + (active ? "border-[#31c4a8] bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300")}>
                    <span className={"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-black " + (active ? "border-[#31c4a8] bg-[#31c4a8] text-white" : "border-slate-300 bg-white text-slate-300")}>
                      {active ? "✓" : ""}
                    </span>
                    <div>
                      <p className={"text-sm font-black " + (active ? "text-[#1f9f87]" : "text-slate-800")}>{lbl2}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {(site.catalogLayouts?.length ?? 0) > 1 ? (
              <p className="mt-2 text-xs font-bold text-[#1f9f87]">{site.catalogLayouts!.length} layouts selecionados — o site vai exibir todos em sequência.</p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            {site.catalog.map((item, index) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label><span className={label}>Nome</span><input className={field} value={item.name} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { name: e.target.value }) }))} /></label>
                  <label><span className={label}>Categoria</span><input className={field} placeholder="Ex: Cortes social" value={item.category ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { category: e.target.value }) }))} /></label>
                  <label><span className={label}>Preco</span><input className={field} value={item.price ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { price: e.target.value }) }))} /></label>
                  <label><span className={label}>Formato da foto</span><select className={field} value={item.imageLayout} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageLayout: e.target.value as typeof item.imageLayout }) }))}><option value="square">Quadrada</option><option value="horizontal">Horizontal</option></select></label>
                  <label className="md:col-span-2"><span className={label}>Descricao</span><textarea className={field} rows={2} value={item.description} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { description: e.target.value }) }))} /></label>
                </div>
                <div className="mt-3"><ImageUploadField label="Imagem do item" value={item.imageUrl} onChange={(url) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageUrl: url }) }))} /><ImageGuidelineHint type={item.imageLayout === "square" ? "productSquare" : "productHorizontal"} /></div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                  <input className={field} placeholder="Texto do botao" value={item.actionLabel ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionLabel: e.target.value }) }))} />
                  <input className={field} placeholder="Link do botao" value={item.actionUrl ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionUrl: e.target.value }) }))} />
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
        {limitState ? <div className="mt-4 rounded-[1.75rem] border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-sm"><p className="text-lg font-black text-slate-950">Você atingiu o limite do plano gratuito. Faça upgrade!</p><p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">Seu plano <span className="font-black text-indigo-700">{limitState.planTier}</span> permite até <span className="font-black text-slate-900">{limitState.limit}</span> biosites e você já possui <span className="font-black text-slate-900">{limitState.current}</span>.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/#planos" className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700">Ver planos e fazer upgrade</Link><Link href="/app" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700">Voltar para meus biosites</Link></div></div> : null}
        <button type="button" onClick={save} disabled={isSaving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-5 w-5" />{isSaving ? "Salvando..." : "Salvar e publicar"}</button>
        {saved ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg">
            <div className="bg-emerald-500 px-6 py-4">
              <p className="text-lg font-black text-white">Bio site salvo com sucesso!</p>
              <p className="mt-0.5 text-sm text-emerald-100">Entregue as informacoes abaixo ao seu cliente.</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <QRCodeSVG value={typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink} size={160} />
                  </div>
                  <p className="text-xs font-bold text-slate-500">QR Code do bio site</p>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Link publico (para clientes)</p>
                    <p className="mt-1 break-all text-sm font-black text-slate-900">{typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink}</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-indigo-400">Como o cliente edita o bio site</p>
                    <p className="mt-2 text-sm font-bold text-indigo-900">1. Acesse: <span className="font-black">https://toqy.com.br/me</span></p>
                    <p className="text-sm font-bold text-indigo-900">2. Slug (nome): <span className="font-black">{site.slug}</span></p>
                    <p className="text-sm font-bold text-indigo-900">3. Chave: <span className="font-mono text-lg font-black text-indigo-700">{site.editKey}</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => copy(typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink, "link")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                  <Copy className="h-4 w-4" />{copied === "link" ? "Copiado!" : "Copiar link"}
                </button>
                <button type="button" onClick={() => copy(site.editKey, "key")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-[#31c4a8]">
                  <Copy className="h-4 w-4" />{copied === "key" ? "Copiada!" : "Copiar chave"}
                </button>
                <button type="button" onClick={() => {
                  const msg = "Ola! Seu bio site TOQY esta pronto\n\nAcesse: " + (typeof window !== "undefined" ? window.location.origin : "https://toqy.com.br") + publicLink + "\n\nPara editar:\n1. Acesse: https://toqy.com.br/me\n2. Slug: " + site.slug + "\n3. Chave: " + site.editKey;
                  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
                }} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100">
                  <MessageCircle className="h-4 w-4" />Enviar ao cliente (WhatsApp)
                </button>
                <Link href={publicLink} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
                  Abrir bio site <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </Section>
    );
  })();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        <div className="mb-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-[#31c4a8]">TOQY Builder</p><h1 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">{mode === "create" ? "Criar bio site" : "Editar bio site"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Tudo editável com preview ao vivo. Depois entregue link, QR Code e chave para o cliente.</p></div>
            <button type="button" onClick={save} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "Salvando..." : "Salvar agora"}</button>
          </div>
          {saved ? <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" />Salvo no navegador.</div> : null}
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">{steps.map((item, index) => <button key={item} type="button" onClick={() => setStep(index)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${index === step ? "bg-[#31c4a8] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{index + 1}. {item}</button>)}</div>
        {body}
        <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-40">Voltar</button>
          <div className="flex gap-3"><button type="button" onClick={save} disabled={isSaving} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Salvando..." : "Salvar agora"}</button><button type="button" onClick={() => step < steps.length - 1 ? setStep((v) => v + 1) : save()} disabled={isSaving} className="rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{step < steps.length - 1 ? "Continuar" : isSaving ? "Salvando..." : "Salvar e publicar"}</button></div>
        </div>
      </div>
      <LiveBioSitePreview site={site} />
    </div>
  );
}