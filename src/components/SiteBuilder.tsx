"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Copy, ExternalLink, Eye, Images, Loader2, MessageCircle, Plus, Save, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { CatalogItem, CatalogLayout, ThemePreset, ToqySite } from "@/lib/types";
import { createEditUrl, createPublicUrl, generateSlug } from "@/lib/dataProvider";
import { RealTemplateGallery } from "./RealTemplateGallery";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { checkBiositeLimit } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";
import { validateSite } from "@/lib/validation";
import { ImageGuidelineHint } from "./ImageGuidelineHint";
import { ImageUploadField, uploadImageFile } from "./ImageUploadField";
import { LiveBioSitePreview } from "./LiveBioSitePreview";
import { PublicBioSite } from "./PublicBioSite";
import { ThemePresetPicker } from "./ThemePresetPicker";
import { ButtonEditor } from "./ButtonEditor";
import { generateId } from "@/lib/security";
import { syncModulesFromButtons } from "@/lib/buttonSync";

type Props = { mode: "create" | "edit"; initialSite: ToqySite; onSave: (site: ToqySite) => unknown | Promise<unknown> };

const steps = ["Modelo", "Perfil", "Visual", "Links e Botões", "Pix e Wi-Fi", "Catálogo", "Salvar"];
const field = "mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const label = "text-sm font-black text-ink";

function Section({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6">{children}</section>;
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs font-semibold leading-relaxed text-muted">{children}</p>;
}

// Bug real corrigido (2026-07-16): TODOS os 10 presets em themePresets.ts
// usam `card: "rgba(...)"` (transparência) — mas <input type="color">
// nativo só aceita "#rrggbb". Quando recebe qualquer outro formato (rgba,
// nome de cor CSS, hex de 3 dígitos), o navegador silenciosamente troca
// pra #000000 assim que o usuário toca no seletor — "mudo a cor e fica
// tudo preto", reportado por cliente. normalizeToHex() resolve QUALQUER
// string de cor CSS válida pro hex equivalente (via canvas), pra alimentar
// o <input> nativo com um valor sempre seguro, sem perder a cor real na
// bolinha de preview (que aceita rgba/qualquer CSS normalmente).
function normalizeToHex(input: string): string {
  const hex6 = /^#[0-9a-fA-F]{6}$/;
  const hex3 = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/;
  if (hex6.test(input)) return input.toLowerCase();
  const m3 = input.match(hex3);
  if (m3) return `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`.toLowerCase();
  if (typeof document === "undefined") return "#000000";
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return "#000000";
    const sentinel = "#123456";
    ctx.fillStyle = sentinel;
    ctx.fillStyle = input;
    // Canvas ignora silenciosamente valores invalidos (mantem o anterior) —
    // se ainda é o sentinel e o input não era literalmente essa cor, foi rejeitado.
    if (ctx.fillStyle === sentinel && input.toLowerCase() !== sentinel) return "#000000";
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return "#000000";
  }
}

function ColorPicker({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza se prop mudar externamente
  useEffect(() => { setLocal(value); }, [value]);

  function handleColorChange(v: string) {
    setLocal(v);
    // Debounce de 80ms para não re-renderizar o bio site a cada pixel do picker
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 80);
  }

  const safeHex = normalizeToHex(local);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <label className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center">
        <span className="h-10 w-10 rounded-full border-2 border-[#ffffff] shadow-md ring-1 ring-border transition hover:scale-110" style={{ background: local }} />
        <input type="color" value={safeHex}
          onChange={(e) => handleColorChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-ink">{label}</p>
        <p className="truncate text-xs text-muted">{hint}</p>
        <input type="text" value={local}
          onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) handleColorChange(e.target.value); }}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1 font-mono text-xs text-ink outline-none focus:border-accent"
          maxLength={7} />
      </div>
    </div>
  );
}

function updateCatalogItem(items: CatalogItem[], index: number, patch: Partial<CatalogItem>) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
}

// Exibição por categoria, não por item (2026-07-16) — correção de bug real
// reportado por cliente: existia um seletor "Onde aparece no bio site"
// DENTRO de cada produto (repetido foto por foto), que além de redundante
// (a intenção é a MESMA foto por foto de uma mesma categoria) também
// disparava uma mudança silenciosa em TODO o catálogo (ver
// hasCustomSections em PublicBioSite.tsx) assim que qualquer item ganhava
// um valor diferente de "padrão" — confuso e imprevisível. Agora a escolha
// é feita UMA VEZ por categoria aqui, e aplica a todos os itens dela de
// uma vez (exceto os marcados individualmente como "Destaque" — esse
// continua sendo uma exceção por item, não por categoria).
function categoryCommonDisplaySection(catalog: CatalogItem[], category: string): string {
  const sibling = catalog.find((i) => i.category?.trim() === category.trim() && i.displaySection !== "destaque");
  return sibling?.displaySection ?? "padrao";
}

function CatalogCategoryDisplayControl({ catalog, onChangeCategory }: { catalog: CatalogItem[]; onChangeCategory: (category: string, mode: string) => void }) {
  const categories = Array.from(new Set(catalog.map((i) => i.category?.trim()).filter((c): c is string => Boolean(c))));
  if (categories.length === 0) return null;
  return (
    <div className="mt-4 rounded-3xl border border-border bg-surface p-4">
      <p className="text-sm font-black text-ink">Exibição por categoria</p>
      <p className="mt-1 text-xs text-muted">Escolha como cada categoria aparece — vale pra todas as fotos dela de uma vez, não precisa configurar foto por foto.</p>
      <div className="mt-3 grid gap-2">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
            <span className="text-sm font-black text-ink">{cat}</span>
            <select
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-black text-ink outline-none focus:border-accent"
              value={categoryCommonDisplaySection(catalog, cat)}
              onChange={(e) => onChangeCategory(cat, e.target.value)}
            >
              <option value="padrao">Capa + clique abre galeria</option>
              <option value="carrossel">Carrossel — desliza todas as fotos</option>
              <option value="grade">Grade — todas, 2 por linha</option>
              <option value="lista">Lista — todas, uma embaixo da outra</option>
              <option value="subcategorias">Subcategorias — 1 capa por subcategoria</option>
            </select>
          </div>
        ))}
      </div>
      {categories.some((cat) => categoryCommonDisplaySection(catalog, cat) === "subcategorias") ? (
        <p className="mt-3 text-xs text-muted">
          Categoria em "Subcategorias": preencha o campo <b>Subcategoria</b> em cada foto (ex: "Cadeiras", "Mesas", "Estantes") — cada subcategoria vira sua própria capa, lado a lado, e clicar abre só as fotos dela.
        </p>
      ) : null}
    </div>
  );
}

// Adicionar várias fotos de uma vez numa categoria (2026-07-16) — pedido
// real de cliente: categoria com várias fotos (ex: "Diretoria") não deveria
// exigir repetir "Adicionar item" + preencher nome/descrição pra cada foto.
// Escolhe a categoria (existente, já com seu modo de exibição — Carrossel/
// Grade/Lista/padrão — ou uma nova), escolhe várias imagens de uma vez.
//
// 2ª versão (2026-07-16): a 1ª versão só tinha campo de texto livre pra
// categoria — risco de digitar "diretoria" com D minúsculo e criar uma
// categoria NOVA/duplicada sem querer, e as fotos novas não herdavam o
// "Onde aparece" (displaySection) da categoria existente — se "Diretoria"
// já estava em modo Carrossel, fotos adicionadas em lote caíam no balde
// "padrão" (ver PublicBioSite.tsx), aparecendo numa seção diferente em vez
// de entrar na mesma fileira de carrossel. Agora escolhe de uma lista das
// categorias que já existem no catálogo e herda o displaySection do
// primeiro item encontrado daquela categoria.
function BulkCatalogPhotoAdd({ slug, catalog, onAdd }: { slug: string; catalog: CatalogItem[]; onAdd: (items: CatalogItem[]) => void }) {
  const existingCategories = Array.from(new Set(catalog.map((i) => i.category?.trim()).filter((c): c is string => Boolean(c))));
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(existingCategories[0] ?? "");
  const [isNewCategory, setIsNewCategory] = useState(existingCategories.length === 0);
  const [subcategory, setSubcategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");

  // Se a categoria escolhida já está em modo "Subcategorias", mostra o
  // campo de subcategoria (2026-07-16) — sem isso, upload em lote nessa
  // categoria caía sem subcategoria, virando "capa" solta em vez de entrar
  // na subcategoria certa (ex: "Cadeiras" dentro de "Home Office").
  const isSubcategoryMode = categoryCommonDisplaySection(catalog, category) === "subcategorias";

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    if (!category.trim()) { setError("Escolha ou digite o nome da categoria primeiro."); return; }
    if (isSubcategoryMode && !subcategory.trim()) { setError("Digite a subcategoria (ex: Cadeiras) primeiro."); return; }
    setError("");
    setUploading(true);
    setProgress({ done: 0, total: files.length });

    // Herda o "Onde aparece" (displaySection) de um item já existente
    // dessa categoria — pra foto nova entrar na MESMA fileira/carrossel,
    // não cair num balde diferente (ex: "padrão").
    const existingItem = catalog.find((i) => i.category?.trim() === category.trim());
    const displaySection = existingItem?.displaySection;

    const newItems: CatalogItem[] = [];
    for (const file of files) {
      try {
        const imageUrl = await uploadImageFile(file, slug, `catalog-bulk-${generateId("img")}`);
        newItems.push({
          id: generateId("prd"),
          name: "",
          description: "",
          price: "",
          imageUrl,
          imageLayout: "square",
          category: category.trim(),
          enabled: true,
          actionLabel: "",
          actionUrl: "",
          ...(displaySection ? { displaySection } : {}),
          ...(isSubcategoryMode && subcategory.trim() ? { subcategory: subcategory.trim() } : {}),
        });
      } catch {
        // Uma foto falhando no upload não derruba as outras — segue o lote.
      }
      setProgress((p) => p ? { ...p, done: p.done + 1 } : p);
    }

    if (newItems.length) onAdd(newItems);
    if (newItems.length < files.length) setError(`${files.length - newItems.length} foto(s) falharam no envio.`);
    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-4">
      <p className="text-sm font-black text-ink">Adicionar várias fotos</p>
      <p className="mt-1 text-xs text-muted">Escolha a categoria (ex: "Diretoria") e suba várias fotos de uma vez, sem precisar preencher nome/descrição em cada uma. Entram no mesmo modo de exibição que a categoria já usa.</p>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        {isNewCategory || existingCategories.length === 0 ? (
          <input
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-black text-ink outline-none focus:border-accent"
            placeholder="Nome da categoria (ex: Diretoria)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        ) : (
          <select
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-black text-ink outline-none focus:border-accent"
            value={category}
            onChange={(e) => {
              if (e.target.value === "__new__") { setIsNewCategory(true); setCategory(""); return; }
              setCategory(e.target.value);
            }}
          >
            {existingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__new__">+ Nova categoria...</option>
          </select>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !category.trim() || (isSubcategoryMode && !subcategory.trim())}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent px-4 py-2.5 text-sm font-black text-accent-dim transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Images className="h-4 w-4" />}
          {uploading ? `Enviando ${progress?.done ?? 0}/${progress?.total ?? 0}` : "Escolher fotos"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {isSubcategoryMode ? (
        <input
          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-black text-ink outline-none focus:border-accent"
          placeholder="Subcategoria (ex: Cadeiras, Mesas, Estantes)"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
        />
      ) : null}
      {isNewCategory && existingCategories.length > 0 ? (
        <button type="button" onClick={() => { setIsNewCategory(false); setCategory(existingCategories[0]); }} className="mt-2 text-xs font-bold text-accent-dim underline">Usar categoria existente</button>
      ) : null}
      {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}

export function SiteBuilder({ mode, initialSite, onSave }: Props) {
  const [site, setSite] = useState<ToqySite>({ ...initialSite, catalogLayout: initialSite.catalogLayout ?? "carousel" });
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<ToqySite | null>(null);
  const [copied, setCopied] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [limitState, setLimitState] = useState<{ current: number; limit: number; planTier: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const publicLink = createPublicUrl(site.slug);
  const editLink = createEditUrl(site.slug);

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
  function setColor(key: string, value: string) { update((s) => ({ ...s, theme: { ...s.theme, colors: { ...s.theme.colors, [key]: value || undefined } } })); }
  function getColor(key: string, fallback: string) { return (site.theme.colors as Record<string, string> | undefined)?.[key] ?? fallback; }

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
        const limitCheck = await checkBiositeLimit(user?.id ?? "");

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
      const result = await syncBiositeToSupabase(siteToValidate);
      if (!result.ok) {
        const isNetwork = result.error?.toLowerCase().includes("fetch") || result.error?.toLowerCase().includes("network") || result.error?.toLowerCase().includes("failed");
        const msg = isNetwork
          ? "Erro de conexão com o servidor. Verifique sua internet e tente novamente. Se persistir, recarregue a página (F5)."
          : `Erro ao salvar: ${result.error ?? "tente novamente"}`;
        setErrors([msg]);
        setIsSaving(false);
        return;
      }
      await onSave(siteToValidate);
      setSite(siteToValidate);
      setSaved(siteToValidate);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Erro ao salvar. Tente novamente."]);
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
          <h2 className="text-2xl font-black text-ink">Modelo</h2>
          <p className="mt-1 text-sm text-muted">Escolha um biosite real de outro negócio como ponto de partida — cores, botões, catálogo e layout já vêm prontos, você só troca as informações do seu negócio.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label><span className={label}>Nome do negócio</span><input className={field} value={site.profile.name} onChange={(e) => {
              const name = e.target.value;
              update((s) => ({
                ...s,
                profile: { ...s.profile, name },
                // Atualiza slug em tempo real enquanto está no padrão gerado pelo nome
                slug: (s.slug === "novo-negocio" || s.slug === generateSlug(s.profile.name) || !s.slug)
                  ? generateSlug(name)
                  : s.slug
              }));
            }} /></label>
            <label>
              <span className={label}>Link da página</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">toqy.com.br/b/</span>
                <input
                  className={`${field} pl-[110px]`}
                  value={site.slug}
                  onChange={(e) => {
                    // Converte espaços em hífens em tempo real
                    const raw = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                    update((s) => ({ ...s, slug: raw }));
                  }}
                  onBlur={(e) => {
                    // Normaliza completamente ao sair do campo
                    update((s) => ({ ...s, slug: generateSlug(e.target.value) }));
                  }}
                />
              </div>
            </label>
          </div>
          <RealTemplateGallery businessName={site.profile.name} onApply={(cloned) => update(() => ({ ...cloned, slug: site.slug, editKey: site.editKey, id: site.id }))} />
        </Section>
      );
    }

    if (step === 1) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-ink">Perfil</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageUploadField
                label="Logo do negócio"
                value={site.profile.logoUrl}
                onChange={(url) => setProfile({ logoUrl: url })}
                slug={site.slug}
                fieldId="logo"
              />
              <ImageGuidelineHint type="logo" />
              <p className="mt-1 text-xs text-muted">Use PNG com fundo transparente para melhor resultado.</p>
            </div>
            <label><span className={label}>Tamanho da logo</span><select className={field} value={site.profile.logoSize} onChange={(e) => setProfile({ logoSize: e.target.value as ToqySite["profile"]["logoSize"] })}><option value="small">Pequena</option><option value="medium">Média</option><option value="large">Grande</option></select></label>
            <label><span className={label}>Formato da logo</span><select className={field} value={site.profile.logoShape} onChange={(e) => setProfile({ logoShape: e.target.value as ToqySite["profile"]["logoShape"] })}><option value="circle">Redonda</option><option value="rounded">Arredondada</option><option value="square">Quadrada</option></select></label>
            <label>
              <span className={label}>Encaixe da logo</span>
              <select className={field} value={site.profile.logoFit ?? "cover"} onChange={(e) => setProfile({ logoFit: e.target.value as "cover" | "contain" })}>
                <option value="cover">Preencher (corta bordas se necessário)</option>
                <option value="contain">Mostrar completa (sem cortes)</option>
              </select>
              <p className="mt-1 text-xs text-muted">PNG com fundo transparente → use "Mostrar completa". Foto → use "Preencher".</p>
            </label>
            <label>
              <span className={label}>Texto decorativo abaixo da logo</span>
              <input className={field} value={site.profile.logoText ?? ""} onChange={(e) => setProfile({ logoText: e.target.value })} placeholder='Ex: "BRAVE TATTOO studio" ou "Barber Shop"' />
              <p className="mt-1 text-xs text-muted">Aparece em destaque abaixo da logo. Deixe em branco para não mostrar.</p>
            </label>
            <label>
              <span className={label}>Estilo do texto decorativo</span>
              <select className={field} value={site.profile.logoFont ?? "bold"} onChange={(e) => setProfile({ logoFont: e.target.value as ToqySite["profile"]["logoFont"] })}>
                <option value="bold">Bold (forte e moderno)</option>
                <option value="serif">Serif (elegante e clássico)</option>
                <option value="italic">Itálico (dinâmico)</option>
                <option value="mono">Monospace (tech)</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <span className={label}>Assinatura / segunda logo</span>
              <p className="mb-2 text-xs text-muted">Imagem que aparece abaixo da logo principal — ex: logo texto, assinatura, nome em arte. Use PNG com fundo transparente.</p>
              <ImageUploadField
                label=""
                value={site.profile.logoSignatureUrl}
                onChange={(url) => setProfile({ logoSignatureUrl: url })}
                placeholder="URL da imagem de assinatura"
                slug={site.slug}
                fieldId="logo-signature"
              />
            </div>
            <label><span className={label}>Título/subtítulo</span><input className={field} value={site.profile.title ?? ""} onChange={(e) => setProfile({ title: e.target.value })} /></label>
            <label><span className={label}>Localização</span><input className={field} value={site.profile.location} onChange={(e) => setProfile({ location: e.target.value })} /></label>
            <label className="md:col-span-2"><span className={label}>Descrição</span><textarea className={field} rows={3} value={site.profile.description} onChange={(e) => setProfile({ description: e.target.value })} /></label>
            <label>
              <span className={label}>WhatsApp</span>
              <input className={field} value={site.contact.whatsapp} onChange={(e) => setContact({ whatsapp: e.target.value })} placeholder="5519999999999" />
              <p className="mt-1 text-xs text-muted">Formato: <strong>wa.me/55 + DDD + número</strong> — ex: 5519999999999</p>
            </label>
            <label>
              <span className={label}>Telefone (salvar contato)</span>
              <input className={field} value={site.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} placeholder="+5519999999999" />
              <p className="mt-1 text-xs text-muted">Com DDI+DDD — ex: +5519999999999. Ao clicar, salva na agenda do celular.</p>
            </label>
            <label>
              <span className={label}>Instagram</span>
              <input className={field} value={site.contact.instagram ?? ""} onChange={(e) => setContact({ instagram: e.target.value })} placeholder="https://instagram.com/seuperfil" />
              <p className="mt-1 text-xs text-muted">Cole o link completo do perfil, não apenas o @.</p>
            </label>
            <label>
              <span className={label}>Facebook</span>
              <input className={field} value={site.contact.facebook ?? ""} onChange={(e) => setContact({ facebook: e.target.value })} placeholder="https://facebook.com/suapagina" />
              <p className="mt-1 text-xs text-muted">Cole o link completo da página ou perfil.</p>
            </label>
            <label><span className={label}>E-mail</span><input className={field} value={site.contact.email ?? ""} onChange={(e) => setContact({ email: e.target.value })} /></label>
            <label><span className={label}>Site</span><input className={field} value={site.contact.website ?? ""} onChange={(e) => setContact({ website: e.target.value })} /></label>
          </div>
        </Section>
      );
    }

    if (step === 2) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-ink">Visual</h2>
          <p className="mt-1 text-sm text-muted">Escolha a paleta de cores, tipo de fundo e estilo dos botões.</p>
          <div className="mt-5"><ThemePresetPicker selectedPresetId={site.themePresetId} onSelect={selectTheme} /></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label><span className={label}>Tipo de fundo</span><select className={field} value={site.theme.backgroundType} onChange={(e) => setTheme({ backgroundType: e.target.value as ToqySite["theme"]["backgroundType"] })}><option value="gradient">Gradiente</option><option value="solid">Cor sólida</option><option value="image">Imagem</option></select></label>
            <label><span className={label}>Layout dos botões</span><select className={field} value={site.theme.buttonStyle} onChange={(e) => setTheme({ buttonStyle: e.target.value as ToqySite["theme"]["buttonStyle"] })}><option value="full">Botões grandes</option><option value="icon">Grade de ícones</option></select></label>
            <label><span className={label}>Preenchimento</span><select className={field} value={site.theme.buttonFill} onChange={(e) => setTheme({ buttonFill: e.target.value as ToqySite["theme"]["buttonFill"] })}><option value="glass">Translúcido premium</option><option value="solid">Sólido</option><option value="gradient">Gradiente</option></select></label>
            <label><span className={label}>Formato</span><select className={field} value={site.theme.buttonRadius} onChange={(e) => setTheme({ buttonRadius: e.target.value as ToqySite["theme"]["buttonRadius"] })}><option value="soft">Soft</option><option value="rounded">Arredondado</option><option value="pill">Pill/cápsula</option></select></label>
            <label><span className={label}>Ícones sociais (WhatsApp, Instagram...)</span><select className={field} value={site.theme.socialIconStyle ?? "brand"} onChange={(e) => setTheme({ socialIconStyle: e.target.value as "brand" | "glass" })}><option value="brand">Cores reais das marcas</option><option value="glass">Translúcido (igual botões)</option></select></label>
            <label className="md:col-span-2">
              <span className={label}>Imagem de fundo</span>
              <div className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>💡 Dica para melhor resultado:</strong> Use imagem <strong>1080×1920px</strong> (formato celular). A imagem fica fixa e o conteúdo rola por cima — ela não vai esticar.
              </div>
              <ImageUploadField label="" value={site.profile.backgroundImageUrl} onChange={(url) => setProfile({ backgroundImageUrl: url })} placeholder="URL da imagem de fundo" slug={site.slug} fieldId="background" />
              <ImageGuidelineHint type="background" />
            </label>
          </div>

          {/* Cores separadas por funcao */}
          <div className="mt-5 space-y-4">
            {/* Fundo */}
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-black text-ink">Fundo do bio site</p>
              <p className="mt-0.5 text-xs text-muted">Define a cor de fundo da pagina inteira.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ColorPicker label="Cor do fundo" hint={site.theme.backgroundType === "gradient" ? "Inicio do gradiente" : "Cor solida de fundo"} value={site.theme.background} onChange={(v) => setTheme({ background: v })} />
                {site.theme.backgroundType === "gradient" ? (
                  <ColorPicker label="Cor 2 do gradiente" hint="Fim do gradiente (mistura com a cor 1)" value={site.theme.gradientTo} onChange={(v) => setTheme({ gradientTo: v })} />
                ) : null}
              </div>
            </div>
            {/* Botoes */}
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-black text-ink">Botoes</p>
              <p className="mt-0.5 text-xs text-muted">Cor de fundo e texto dos botoes principais.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ColorPicker label="Cor dos botoes" hint="Fundo dos botoes e links" value={site.theme.primary} onChange={(v) => setTheme({ primary: v })} />
                <ColorPicker label="Gradiente dos botoes" hint="Segunda cor (botoes gradiente)" value={site.theme.secondary} onChange={(v) => setTheme({ secondary: v })} />
              </div>
            </div>
            {/* Texto e destaques */}
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-black text-ink">Textos e destaques</p>
              <p className="mt-0.5 text-xs text-muted">Cor dos textos, precos e rotulos no bio site.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <ColorPicker label="Texto principal" hint="Nome, descricao, labels" value={site.theme.text} onChange={(v) => setTheme({ text: v })} />
                <ColorPicker label="Texto secundario" hint="Subtitulos e hints" value={site.theme.muted} onChange={(v) => setTheme({ muted: v })} />
                <ColorPicker label="Destaque / Preco" hint="Precos, rotulos, badges" value={site.theme.accent} onChange={(v) => setTheme({ accent: v })} />
              </div>
            </div>
            {/* Cards */}
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-black text-ink">Cards e paineis</p>
              <p className="mt-0.5 text-xs text-muted">Cor de fundo dos cartoes e modais internos.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ColorPicker label="Fundo dos cards" hint="Cards, modais, secoes" value={site.theme.card} onChange={(v) => setTheme({ card: v })} />
              </div>
            </div>

            {/* CORES GRANULARES */}
            <div className="rounded-3xl border border-border bg-surface p-5">
              <p className="text-sm font-black text-ink">🎨 Cores por elemento</p>
              <p className="mt-0.5 text-xs text-muted mb-4">Personalize cada parte separadamente. Deixe em branco para usar a cor geral do tema.</p>

              <details className="mb-3">
                <summary className="cursor-pointer text-xs font-black text-ink py-1">Textos do perfil (nome, subtítulo, endereço...)</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ColorPicker label="Nome do negócio" hint="Título principal" value={getColor("name", site.theme.text)} onChange={(v) => setColor("name", v)} />
                  <ColorPicker label="Subtítulo/segmento" hint="Ex: Dentista, Barbearia" value={getColor("title", site.theme.muted)} onChange={(v) => setColor("title", v)} />
                  <ColorPicker label="Endereço/localização" hint="Linha do endereço" value={getColor("location", site.theme.muted)} onChange={(v) => setColor("location", v)} />
                  <ColorPicker label="Descrição" hint="Texto de apresentação" value={getColor("description", site.theme.muted)} onChange={(v) => setColor("description", v)} />
                  <ColorPicker label="Texto decorativo/assinatura" hint="Texto abaixo da logo" value={getColor("logoText", site.theme.text)} onChange={(v) => setColor("logoText", v)} />
                </div>
              </details>

              <details className="mb-3">
                <summary className="cursor-pointer text-xs font-black text-ink py-1">Botões Salvar Contato, Ligar e Wi-Fi</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ColorPicker label="Texto — Salvar Contato" hint="Cor do texto do botão" value={getColor("saveContactText", site.theme.text)} onChange={(v) => setColor("saveContactText", v)} />
                  <ColorPicker label="Texto — Ligar" hint="Cor do texto do botão" value={getColor("callText", site.theme.text)} onChange={(v) => setColor("callText", v)} />
                  <ColorPicker label="Texto — Wi-Fi inline" hint="Cor do texto de rede/senha" value={getColor("wifiText", site.theme.text)} onChange={(v) => setColor("wifiText", v)} />
                </div>
              </details>

              <details className="mb-3">
                <summary className="cursor-pointer text-xs font-black text-ink py-1">Botões grandes (Agendar, Pix, etc.)</summary>
                <div className="mt-3">
                  {site.theme.buttonFill === "glass" ? (
                    <p className="text-xs text-muted rounded-xl bg-surface p-3">No modo <strong>Translúcido</strong> as cores dos botões são automáticas. Mude o preenchimento para <strong>Sólido</strong> para personalizar as cores.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ColorPicker label="Fundo dos botões" hint="Cor de fundo" value={getColor("buttonBg", site.theme.primary)} onChange={(v) => setColor("buttonBg", v)} />
                      <ColorPicker label="Texto dos botões" hint="Cor do texto/ícone" value={getColor("buttonText", site.theme.text)} onChange={(v) => setColor("buttonText", v)} />
                      <ColorPicker label="Borda dos botões" hint="Cor da borda" value={getColor("buttonBorder", site.theme.primary)} onChange={(v) => setColor("buttonBorder", v)} />
                    </div>
                  )}
                </div>
              </details>

              <details>
                <summary className="cursor-pointer text-xs font-black text-ink py-1">Catálogo (cards, preços, botões)</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ColorPicker label="Título do catálogo" hint="Ex: Nossos Serviços" value={getColor("catalogTitle", site.theme.text)} onChange={(v) => setColor("catalogTitle", v)} />
                  <ColorPicker label="Fundo dos cards" hint="Cor de fundo de cada card" value={getColor("catalogItemBg", site.theme.card)} onChange={(v) => setColor("catalogItemBg", v)} />
                  <ColorPicker label="Nome do item" hint="Titulo do serviço/produto" value={getColor("catalogItemName", site.theme.text)} onChange={(v) => setColor("catalogItemName", v)} />
                  <ColorPicker label="Descrição do item" hint="Texto descritivo" value={getColor("catalogItemDesc", site.theme.muted)} onChange={(v) => setColor("catalogItemDesc", v)} />
                  <ColorPicker label="Preço" hint="Valor em R$" value={getColor("catalogItemPrice", site.theme.accent)} onChange={(v) => setColor("catalogItemPrice", v)} />
                  <ColorPicker label="Badge/Destaque" hint="Cor do rótulo especial" value={getColor("catalogItemHighlight", "#b45309")} onChange={(v) => setColor("catalogItemHighlight", v)} />
                  <ColorPicker label="Fundo botão de ação" hint="Ex: Ver, Agendar" value={getColor("catalogActionBg", site.theme.primary)} onChange={(v) => setColor("catalogActionBg", v)} />
                  <ColorPicker label="Texto botão de ação" hint="Cor do texto" value={getColor("catalogActionText", "#ffffff")} onChange={(v) => setColor("catalogActionText", v)} />
                </div>
              </details>
            </div>
          </div>

        </Section>
      );
    }

    if (step === 3) return <ButtonEditor site={site} onChange={(next) => update(next)} />;

    if (step === 4) {
      return (
        <Section>
          <h2 className="text-2xl font-black text-ink">Pix e Wi-Fi</h2>
          <p className="mt-1 text-sm text-muted">Configure Pix com comprovante e Wi-Fi com check-in/avaliação.</p>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800">Botão "Salvar Contato"</p>
                <p className="text-xs text-slate-500 mt-0.5">Aparece no bio site para o cliente salvar o contato na agenda</p>
              </div>
              <div className="relative w-10 h-6 shrink-0 ml-3" onClick={() => update((s) => ({ ...s, modules: { ...s.modules, saveContact: !(s.modules?.saveContact ?? true) } }))}>
                <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.modules?.saveContact ?? true) ? "bg-[#31c4a8]" : "bg-slate-300")} />
                <div className={"absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform " + ((site.modules?.saveContact ?? true) ? "translate-x-5" : "translate-x-1")} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-ink">Pix premium</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black text-ink">Ativar Pix</span>
                  <div className="relative w-10 h-6" onClick={() => update((s) => {
                    const nowEnabled = !(s.pix.enabled ?? false);
                    const buttons = nowEnabled
                      ? s.buttons.some(b => b.type === "pix") ? s.buttons : [...s.buttons, { id: `pix-${Date.now()}`, type: "pix" as const, label: "Pix", url: "", enabled: true }]
                      : s.buttons.filter(b => b.type !== "pix");
                    return { ...s, pix: { ...s.pix, enabled: nowEnabled }, buttons };
                  })}>
                    <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + (site.pix.enabled ? "bg-accent" : "bg-border")} />
                    <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + (site.pix.enabled ? "translate-x-5" : "translate-x-1")} />
                  </div>
                </label>
              </div>
              {(site.pix.enabled ?? false) ? (
              <div className="grid gap-4">
                <label><span className={label}>Chave Pix</span><input className={field} value={site.pix.key} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, key: e.target.value, enabled: true } }))} /></label>
                <label><span className={label}>Recebedor</span><input className={field} value={site.pix.receiver} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, receiver: e.target.value } }))} /></label>
                <label><span className={label}>Banco/observação</span><input className={field} value={site.pix.bank ?? ""} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, bank: e.target.value } }))} /></label>
                <label><span className={label}>WhatsApp para comprovante</span><input className={field} value={site.pix.whatsappProofNumber} onChange={(e) => update((s) => ({ ...s, pix: { ...s.pix, whatsappProofNumber: e.target.value } }))} /></label>
                <div>
                  <span className={label}>Valores rápidos do Pix</span>
                  <p className="mb-2 text-xs text-muted">Clique para ativar/desativar. Esses valores aparecem como botões rápidos no modal Pix.</p>
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 15, 20, 30, 50, 100, 150, 200].map((v) => {
                      const active = site.pix.quickAmounts.includes(v);
                      return (
                        <button key={v} type="button"
                          onClick={() => update((s) => ({ ...s, pix: { ...s.pix, quickAmounts: active ? s.pix.quickAmounts.filter((a) => a !== v) : [...s.pix.quickAmounts, v].sort((a, b) => a - b) } }))}
                          className={"rounded-full border px-4 py-2 text-sm font-black transition " + (active ? "border-accent bg-accent/10 text-accent-dim" : "border-border bg-card text-muted hover:border-accent")}>
                          R$ {v}
                        </button>
                      );
                    })}
                  </div>
                  <input className={"mt-2 " + field} placeholder="Valor personalizado, ex: 250" type="number" min="1" onKeyDown={(e) => { if (e.key === "Enter") { const v = parseInt((e.target as HTMLInputElement).value); if (v > 0 && !site.pix.quickAmounts.includes(v)) { update((s) => ({ ...s, pix: { ...s.pix, quickAmounts: [...s.pix.quickAmounts, v].sort((a, b) => a - b) } })); (e.target as HTMLInputElement).value = ""; } } }} />
                  <p className="mt-1 text-xs text-muted">Digite um valor e pressione Enter para adicionar personalizado.</p>
                </div>
              </div>
              ) : (
                <p className="text-sm text-muted text-center py-2">Pix desativado — o botão não aparecerá no bio site.</p>
              )}
            </div>
            <div className="rounded-3xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-ink">Wi-Fi + check-in</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-black text-ink">Ativar Wi-Fi</span>
                  <div className="relative">
                    <div onClick={() => update((s) => {
                      const nowEnabled = !(s.wifi.enabled ?? false);
                      const buttons = nowEnabled
                        ? s.buttons.some(b => b.type === "wifi") ? s.buttons : [...s.buttons, { id: `wifi-${Date.now()}`, type: "wifi" as const, label: "Wi-Fi", url: "", enabled: true }]
                        : s.buttons.filter(b => b.type !== "wifi");
                      return { ...s, wifi: { ...s.wifi, enabled: nowEnabled }, buttons };
                    })} className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + (site.wifi.enabled ? "bg-accent" : "bg-border")}>
                      <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + (site.wifi.enabled ? "translate-x-5" : "translate-x-1")} />
                    </div>
                  </div>
                </label>
              </div>
              {(site.wifi.enabled ?? false) ? (
              <div className="grid gap-4">
                <label className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
                  <div>
                    <span className="text-sm font-black text-ink">Mostrar Wi-Fi no topo do bio site</span>
                    <p className="text-xs text-muted">Exibe rede e senha direto na tela</p>
                  </div>
                  <div className="relative w-10 h-6 shrink-0 ml-3" onClick={() => update((s) => ({ ...s, wifi: { ...s.wifi, showInline: !(s.wifi.showInline ?? true) } }))}>
                    <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.wifi.showInline ?? true) ? "bg-accent" : "bg-border")} />
                    <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + ((site.wifi.showInline ?? true) ? "translate-x-5" : "translate-x-1")} />
                  </div>
                </label>
                <label><span className={label}>Nome da rede Wi-Fi</span><input className={field} value={site.wifi.ssid} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, ssid: e.target.value } }))} /></label>
                <label><span className={label}>Senha Wi-Fi</span><input className={field} value={site.wifi.password} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, password: e.target.value } }))} /></label>
                <label><span className={label}>Segurança</span><select className={field} value={site.wifi.encryption} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, encryption: e.target.value as ToqySite["wifi"]["encryption"] } }))}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Sem senha</option></select></label>
                <label><span className={label}>Link de check-in/avaliação</span><input className={field} value={site.wifi.checkinUrl ?? ""} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, checkinUrl: e.target.value } }))} placeholder="Facebook, Google avaliação, Instagram..." /></label>
                <label><span className={label}>Texto do botão de check-in</span><input className={field} value={site.wifi.checkinLabel ?? ""} onChange={(e) => update((s) => ({ ...s, wifi: { ...s.wifi, checkinLabel: e.target.value } }))} placeholder="Fazer check-in no Facebook" /></label>
                <label><span className={label}>Link Google avaliação</span><input className={field} value={site.links.googleReviewUrl ?? ""} onChange={(e) => setLinks({ googleReviewUrl: e.target.value })} /></label>
              </div>
              ) : (
                <p className="text-sm text-muted text-center py-2">Wi-Fi desativado — o bloco não aparecerá no bio site.</p>
              )}
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
              <h2 className="text-2xl font-black text-ink">Catalogo</h2>
              <p className="mt-1 text-sm text-muted">Configure itens, layout e textos do catalogo.</p>
            </div>
            <button type="button" onClick={() => update((s) => ({ ...s, catalog: [...s.catalog, { id: generateId("prd"), name: "", description: "", price: "", imageUrl: "", imageLayout: "square", category: "Destaques", enabled: true, actionLabel: "", actionUrl: "" }] }))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Adicionar item</button>
          </div>

          <div className="mt-4">
            <BulkCatalogPhotoAdd slug={site.slug} catalog={site.catalog} onAdd={(items) => update((s) => ({ ...s, catalog: [...s.catalog, ...items] }))} />
          </div>

          {/* Card promo editavel */}
          <div className="mt-5 rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className={label}>Card "Mais praticidade..."</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-muted">{(site.promoCard?.enabled ?? true) ? "Visível" : "Oculto"}</span>
                <div className="relative w-10 h-6" onClick={() => update((s) => ({ ...s, promoCard: { enabled: !(s.promoCard?.enabled ?? true), title: s.promoCard?.title ?? "Mais praticidade em um só lugar", description: s.promoCard?.description ?? "Acesse contatos, Pix, Wi-Fi, catálogo, rotas e avaliações.", buttonLabel: s.promoCard?.buttonLabel ?? "Ver mais" } }))}>
                  <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.promoCard?.enabled ?? true) ? "bg-accent" : "bg-border")} />
                  <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + ((site.promoCard?.enabled ?? true) ? "translate-x-5" : "translate-x-1")} />
                </div>
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

          {/* Titulo e subtitulo do catalogo */}
          <div className="mt-4 grid gap-3 rounded-3xl border border-border bg-surface p-4 md:grid-cols-2">
            <label>
              <div className="flex items-center justify-between">
                <span className={label}>Título do catálogo</span>
                <div className="relative w-10 h-6 shrink-0 ml-3" onClick={() => update((s) => ({ ...s, showCatalogTitle: !(s.showCatalogTitle ?? true) }))}>
                  <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.showCatalogTitle ?? true) ? "bg-accent" : "bg-border")} />
                  <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + ((site.showCatalogTitle ?? true) ? "translate-x-5" : "translate-x-1")} />
                </div>
              </div>
              <input className={field} placeholder="Nossos serviços" value={site.catalogTitle ?? ""} onChange={(e) => update((s) => ({ ...s, catalogTitle: e.target.value }))} />
            </label>
            <label>
              <div className="flex items-center justify-between">
                <span className={label}>Subtítulo</span>
                <div className="relative w-10 h-6 shrink-0 ml-3" onClick={() => update((s) => ({ ...s, showCatalogSubtitle: !(s.showCatalogSubtitle ?? true) }))}>
                  <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.showCatalogSubtitle ?? true) ? "bg-accent" : "bg-border")} />
                  <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + ((site.showCatalogSubtitle ?? true) ? "translate-x-5" : "translate-x-1")} />
                </div>
              </div>
              <input className={field} placeholder="Selecionados para você..." value={site.catalogSubtitle ?? ""} onChange={(e) => update((s) => ({ ...s, catalogSubtitle: e.target.value }))} />
            </label>
          </div>

          {/* Layout do catalogo - escolha única (2026-07-16, simplificado)
              Antes permitia marcar até 3 layouts, e o site mostrava TODOS
              em sequência — isso que causava a página duplicar (ex:
              "Destaques" seguido de "Lista completa" com os MESMOS
              produtos) — bug real reportado por cliente. Também removida
              a opção "Carrossel por categoria": virou redundante com o
              painel "Exibição por categoria" abaixo, que já faz isso por
              categoria, sem duplicar nem esconder. Este seletor agora só
              define o estilo padrão pra categorias que não tiverem uma
              exibição específica escolhida ali embaixo. */}
          <div className="mt-4 rounded-3xl border border-border bg-surface p-4">
            <span className={label}>Estilo padrão do catálogo</span>
            <p className="mb-3 mt-1 text-xs text-muted">Vale pras categorias que não tiverem uma exibição específica escolhida no painel "Exibição por categoria" abaixo.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["carousel", "Carrossel horizontal", "Capa por categoria, arrasta para o lado — clique abre as outras fotos"],
                ["grid",     "Grade 2 colunas",      "Visual de loja, dois itens por linha"],
                ["stack",    "Lista vertical",       "Uma foto grande embaixo da outra"],
              ] as const).map(([value, lbl2, desc]) => {
                const active = (site.catalogLayout ?? "carousel") === value;
                return (
                  <button key={value} type="button" onClick={() => update((s) => ({ ...s, catalogLayout: value, catalogLayouts: [value] }))}
                    className={"flex items-start gap-3 rounded-2xl border p-3 text-left transition " + (active ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent")}>
                    <span className={"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black " + (active ? "border-accent bg-accent text-white" : "border-border bg-card text-muted")}>
                      {active ? "✓" : ""}
                    </span>
                    <div>
                      <p className={"text-sm font-black " + (active ? "text-accent-dim" : "text-ink")}>{lbl2}</p>
                      <p className="mt-0.5 text-xs text-muted">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <CatalogCategoryDisplayControl
            catalog={site.catalog}
            onChangeCategory={(cat, mode) => update((s) => ({
              ...s,
              catalog: s.catalog.map((i) => i.category?.trim() === cat && i.displaySection !== "destaque"
                ? { ...i, displaySection: mode === "padrao" ? undefined : mode }
                : i
              ),
            }))}
          />

          <div className="mt-5 grid gap-4">
            {site.catalog.map((item, index) => (
              <article key={item.id} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                {/* Header do item com reordenação */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={index === 0} onClick={() => update((s) => { const c = [...s.catalog]; [c[index-1],c[index]] = [c[index],c[index-1]]; return {...s,catalog:c}; })} className="rounded-lg border border-border p-1.5 text-muted hover:text-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" disabled={index === site.catalog.length-1} onClick={() => update((s) => { const c = [...s.catalog]; [c[index],c[index+1]] = [c[index+1],c[index]]; return {...s,catalog:c}; })} className="rounded-lg border border-border p-1.5 text-muted hover:text-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <span className="text-xs font-bold text-muted">#{index + 1}</span>
                    {item.displaySection === "destaque" ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">Destaque</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-black text-ink">
                      <input
                        type="checkbox"
                        checked={item.displaySection === "destaque"}
                        onChange={(e) => update((s) => ({
                          ...s,
                          catalog: updateCatalogItem(s.catalog, index, {
                            displaySection: e.target.checked
                              ? "destaque"
                              : (() => {
                                  const mode = categoryCommonDisplaySection(s.catalog, item.category ?? "");
                                  return mode === "padrao" ? undefined : mode;
                                })(),
                          }),
                        }))}
                      />
                      Destaque
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-black text-ink"><input type="checkbox" checked={item.enabled} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { enabled: e.target.checked }) }))} />Ativo</label>
                    <button type="button" onClick={() => update((s) => ({ ...s, catalog: s.catalog.filter((_, i) => i !== index) }))} className="rounded-xl border border-red-100 bg-red-50 px-2.5 py-1.5 text-red-500 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label><span className={label}>Nome (opcional — deixe vazio pra só foto)</span><input className={field} placeholder="Ex: Corte degradê" value={item.name} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { name: e.target.value }) }))} /></label>
                  <label><span className={label}>Categoria</span><input className={field} placeholder="Ex: Cortes social" value={item.category ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { category: e.target.value }) }))} /></label>
                  <label>
                    <span className={label}>Subcategoria (opcional)</span>
                    <input className={field} placeholder="Ex: Cadeiras, Mesas, Estantes" value={item.subcategory ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { subcategory: e.target.value }) }))} />
                    <p className="mt-1 text-xs text-muted">Só faz efeito se a categoria estiver com exibição "Subcategorias" (ver painel acima).</p>
                  </label>
                  {/* "Onde aparece no bio site" por item foi removido (2026-07-16)
                      — virou "Exibição por categoria" acima, uma escolha só
                      pra categoria inteira. O checkbox "Destaque" (no header
                      do item) continua sendo a única exceção por item. */}
                  {/* Preço com R$ automático */}
                  <label>
                    <span className={label}>Preço</span>
                    <div className="flex items-center gap-0">
                      <span className="flex h-[42px] items-center rounded-l-xl border border-r-0 border-border bg-surface px-3 text-sm font-black text-muted">R$</span>
                      <input className="h-[42px] flex-1 rounded-r-xl border border-border bg-card px-3 text-sm font-black outline-none focus:border-accent" placeholder="80,00" value={item.price?.replace(/^R\$\s?/, "") ?? ""} onChange={(e) => { const v = e.target.value.replace(/[^0-9,.]/g, ""); update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { price: v ? `R$ ${v}` : "" }) })); }} />
                    </div>
                  </label>
                  <label><span className={label}>Formato da foto</span><select className={field} value={item.imageLayout} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageLayout: e.target.value as typeof item.imageLayout }) }))}><option value="square">Quadrada</option><option value="horizontal">Horizontal</option></select></label>
                  <label><span className={label}>Badge / Destaque</span><input className={field} placeholder='Ex: "Mais vendido", "Novidade"' value={item.highlight ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { highlight: e.target.value }) }))} /></label>
                  <label className="md:col-span-2"><span className={label}>Descrição (opcional)</span><textarea className={field} rows={2} placeholder="Deixe vazio pra mostrar só a foto, sem texto" value={item.description} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { description: e.target.value }) }))} /></label>
                </div>
                <div className="mt-3"><ImageUploadField label="Imagem do item" value={item.imageUrl} onChange={(url) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageUrl: url }) }))} slug={site.slug} fieldId={`catalog-${item.id}`} /><ImageGuidelineHint type={item.imageLayout === "square" ? "productSquare" : "productHorizontal"} /></div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input className={field} placeholder="Texto do botão (ex: Agendar)" value={item.actionLabel ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionLabel: e.target.value }) }))} />
                  <input className={field} placeholder="Link do botão (opcional)" value={item.actionUrl ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionUrl: e.target.value }) }))} />
                </div>
              </article>
            ))}
          </div>

          {/* Rodapé do catálogo - "Não encontrou?" */}
          <div className="mt-6 rounded-3xl border border-border bg-surface p-4 space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-ink">Botão WhatsApp nos itens</span>
                <p className="text-xs text-muted">Ícone do WhatsApp em cada card do catálogo</p>
              </div>
              <div className="relative w-10 h-6 shrink-0 ml-3" onClick={() => update((s) => ({ ...s, showCatalogWhatsapp: !(s.showCatalogWhatsapp ?? true) }))}>
                <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.showCatalogWhatsapp ?? true) ? "bg-accent" : "bg-border")} />
                <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + ((site.showCatalogWhatsapp ?? true) ? "translate-x-5" : "translate-x-1")} />
              </div>
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="text-sm font-black text-ink">Botão &quot;Ver&quot; nos itens</span>
                <p className="text-xs text-muted">Botão de ação em cada card do catálogo</p>
              </div>
              <div className="relative w-10 h-6 shrink-0 ml-3" onClick={() => update((s) => ({ ...s, showCatalogAction: !(s.showCatalogAction ?? true) }))}>
                <div className={"w-10 h-6 rounded-full cursor-pointer transition-colors " + ((site.showCatalogAction ?? true) ? "bg-accent" : "bg-border")} />
                <div className={"absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform " + ((site.showCatalogAction ?? true) ? "translate-x-5" : "translate-x-1")} />
              </div>
            </label>
            <div>
              <span className="text-sm font-black text-ink mb-1 block">Texto do rodapé — "Não encontrou?"</span>
              <p className="text-xs text-muted mb-2">⚠️ Este campo muda só o texto do rodapé do catálogo. Não afeta outros textos.</p>
              <input className={field} placeholder="Não encontrou o que procura? Fale com a gente!" value={site.catalogWaLabel ?? ""} onChange={(e) => update((s) => ({ ...s, catalogWaLabel: e.target.value }))} />
            </div>
          </div>
        </Section>
      );
    }

    return (
      <Section>
        <h2 className="text-2xl font-black text-ink">{mode === "create" ? "Publicar" : "Salvar alterações"}</h2>
        <p className="mt-1 text-sm text-muted">Confira, salve e entregue o link junto com a chave de acesso.</p>
        {errors.length ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{errors.map((err) => <p key={err}>{err}</p>)}</div> : null}
        {limitState ? <div className="mt-4 rounded-[1.75rem] border border-violet/20 bg-gradient-to-br from-violet/10 via-card to-surface p-5 shadow-sm"><p className="text-lg font-black text-ink">Você atingiu o limite do plano gratuito. Faça upgrade!</p><p className="mt-2 text-sm font-medium leading-relaxed text-muted">Seu plano <span className="font-black text-violet">{limitState.planTier}</span> permite até <span className="font-black text-ink">{limitState.limit}</span> biosites e você já possui <span className="font-black text-ink">{limitState.current}</span>.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/#planos" className="inline-flex items-center justify-center rounded-2xl bg-violet px-5 py-3 text-sm font-black text-white transition hover:opacity-90">Ver planos e fazer upgrade</Link><Link href="/app" className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink transition hover:border-violet/30 hover:text-violet">Voltar para meus biosites</Link></div></div> : null}
        <button type="button" onClick={save} disabled={isSaving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-5 w-5" />{isSaving ? "Salvando..." : "Salvar e publicar"}</button>
        {saved ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-200 bg-card shadow-lg">
            <div className="bg-emerald-500 px-6 py-4">
              <p className="text-lg font-black text-white">Bio site salvo com sucesso!</p>
              <p className="mt-0.5 text-sm text-emerald-100">Entregue as informacoes abaixo ao seu cliente.</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <QRCodeSVG value={typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink} size={160} />
                  </div>
                  <p className="text-xs font-bold text-muted">QR Code do bio site</p>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">Link publico (para clientes)</p>
                    <p className="mt-1 break-all text-sm font-black text-ink">{typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink}</p>
                  </div>
                  <div className="rounded-2xl border border-violet/20 bg-violet/10 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-violet">Como o cliente edita o bio site</p>
                    <p className="mt-2 text-sm font-bold text-ink">1. Acesse: <span className="font-black">https://toqy.com.br/me</span></p>
                    <p className="text-sm font-bold text-ink">2. Slug (nome): <span className="font-black">{site.slug}</span></p>
                    <p className="text-sm font-bold text-ink">3. Chave: <span className="font-mono text-lg font-black text-violet">{site.editKey}</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => copy(typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink, "link")} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink transition hover:border-accent">
                  <Copy className="h-4 w-4" />{copied === "link" ? "Copiado!" : "Copiar link"}
                </button>
                <button type="button" onClick={() => copy(site.editKey, "key")} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink transition hover:border-accent">
                  <Copy className="h-4 w-4" />{copied === "key" ? "Copiada!" : "Copiar chave"}
                </button>
                <button type="button" onClick={() => {
                  const msg = "Ola! Seu bio site TOQY esta pronto\n\nAcesse: " + (typeof window !== "undefined" ? window.location.origin : "https://toqy.com.br") + publicLink + "\n\nPara editar:\n1. Acesse: https://toqy.com.br/me\n2. Slug: " + site.slug + "\n3. Chave: " + site.editKey;
                  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
                }} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100">
                  <MessageCircle className="h-4 w-4" />Enviar ao cliente (WhatsApp)
                </button>
                <Link href={publicLink} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white transition hover:opacity-90">
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
        <div className="mb-5 rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">TOQY Builder</p><h1 className="mt-2 text-3xl font-black text-ink md:text-5xl">{mode === "create" ? "Criar bio site" : "Editar bio site"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Tudo editável com preview ao vivo. Depois entregue link, QR Code e chave para o cliente.</p></div>
            <button type="button" onClick={save} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "Salvando..." : "Salvar agora"}</button>
          </div>
          {saved ? <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" />Salvo no navegador.</div> : null}
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-border bg-card p-2 shadow-sm">{steps.map((item, index) => <button key={item} type="button" onClick={() => setStep(index)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${index === step ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>{index + 1}. {item}</button>)}</div>
        {body}
        <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))} className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink disabled:opacity-40">Voltar</button>
          <div className="flex gap-3"><button type="button" onClick={save} disabled={isSaving} className="rounded-2xl border border-accent/20 bg-accent/5 px-5 py-3 text-sm font-black text-accent-dim disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Salvando..." : "Salvar agora"}</button><button type="button" onClick={() => step < steps.length - 1 ? setStep((v) => v + 1) : save()} disabled={isSaving} className="rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{step < steps.length - 1 ? "Continuar" : isSaving ? "Salvando..." : "Salvar e publicar"}</button></div>
        </div>
      </div>
      <LiveBioSitePreview site={site} />

      {/* Botão flutuante de preview no mobile */}
      <div className="fixed bottom-6 right-6 z-50 xl:hidden">
        <button
          type="button"
          onClick={() => setShowMobilePreview(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20 transition hover:scale-105 active:scale-95"
          aria-label="Ver preview"
        >
          <Eye className="h-6 w-6" />
        </button>
      </div>

      {/* Modal de preview mobile */}
      {showMobilePreview ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-ink xl:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-black text-white">Preview — /b/{site.slug}</p>
            <button type="button" onClick={() => setShowMobilePreview(false)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white">Fechar</button>
          </div>
          <div className="flex-1 overflow-y-auto"><PublicBioSite site={site} embedded /></div>
        </div>
      ) : null}
    </div>
  );
}