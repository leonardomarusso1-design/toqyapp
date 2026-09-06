"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Copy, ExternalLink, Eye, Images, Loader2, MessageCircle, Plus, Save, Share2, Trash2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
// Limpeza (2026-09-06, auditoria externa): o tipo CatalogLayout e o helper
// createEditUrl saíram dos imports — o tipo não era referenciado em nenhuma
// anotação e createEditUrl só alimentava a const editLink, também morta.
import type { BusinessHoursDay, CatalogItem, ColorRole, ColorValue, ThemePreset, ToqySite } from "@/lib/types";
import { createPublicUrl, generateSlug } from "@/lib/dataProvider";
import { COLOR_ROLES } from "@/lib/colorRoles";
import { BODY_BLOCK_LABELS, resolveBodyBlockOrder } from "@/lib/bodyBlocks";
import { RealTemplateGallery } from "./RealTemplateGallery";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { checkBiositeLimit } from "@/lib/planLimits";
import { OVERAGE_LINKS, canUseStickersAndMusic, canUseWhiteLabel, resolvePlanTier, type PlanType } from "@/lib/subscriptions";
import { supabase } from "@/lib/supabaseClient";
import { validateSite } from "@/lib/validation";
import { ImageGuidelineHint } from "./ImageGuidelineHint";
import { ImageUploadField, uploadImageFile } from "./ImageUploadField";
import { AudioUploadField } from "./AudioUploadField";
import { LiveBioSitePreview } from "./LiveBioSitePreview";
import { PublicBioSite } from "./PublicBioSite";
import { StickerIcon } from "./StickerIcon";
import { STICKER_LIBRARY } from "@/lib/stickerLibrary";
import { ThemePresetPicker } from "./ThemePresetPicker";
import { ButtonEditor } from "./ButtonEditor";
import { generateId } from "@/lib/security";
import { syncModulesFromButtons } from "@/lib/buttonSync";
import { DragHandle, DragReorderList } from "./DragReorderList";

// Rótulos + ordem padrão dos blocos reordenáveis vivem em
// src/lib/bodyBlocks.ts desde 2026-09-06 (entrou o bloco "hours" do mockup
// da auditoria externa e a lista estava duplicada aqui e no site público).
// Wi-Fi inline e o card de Salvar Contato/Ligar continuam fixos (núcleo
// padronizado), não entram na lista arrastável.

// Horário de funcionamento (2026-09-06, mockup da auditoria externa).
// Ordem de EDIÇÃO começa na segunda — é como um negócio local lê a própria
// semana — mas o dado guardado usa o índice de Date.getDay() (0 = domingo),
// pra o site público casar direto com o relógio do visitante.
const WEEKDAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const WEEKDAY_EDIT_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Sugestão inicial ao ligar o horário pela primeira vez — comércio de rua
// típico (seg-sex 9h-18h, sábado até 13h, domingo fechado). É só um ponto
// de partida editável; nada disso aparece sem a pessoa ligar a chave.
function defaultBusinessHoursDays(): BusinessHoursDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    closed: weekday === 0,
    open: "09:00",
    close: weekday === 6 ? "13:00" : "18:00",
  }));
}

type Props = { mode: "create" | "edit"; initialSite: ToqySite; onSave: (site: ToqySite) => unknown | Promise<unknown> };

const steps = ["Modelo", "Perfil", "Visual", "Links e Botões", "Pix e Wi-Fi", "Catálogo", "Salvar"];
const field = "mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const label = "text-sm font-black text-ink";

function Section({ children }: { children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6">{children}</section>;
}

// Limpeza (2026-09-06, auditoria externa): o componente Help() foi removido —
// nenhum painel do builder o renderizava (os textos de ajuda são escritos
// direto com <p className="text-xs ... text-muted">).

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

// Um único seletor sólido (swatch + hex) — usado pelo ColorPicker abaixo
// tanto pro modo "Sólida" quanto pros 2 lados (de/para) do "Gradiente".
function HexSwatchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setLocal(value); }, [value]);

  function handleColorChange(v: string) {
    setLocal(v);
    // Debounce de 80ms para não re-renderizar o bio site a cada pixel do picker
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 80);
  }

  const safeHex = normalizeToHex(local);
  return (
    <div className="flex items-center gap-2">
      <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center">
        <span className="h-9 w-9 rounded-full border-2 border-[#ffffff] shadow-md ring-1 ring-border transition hover:scale-110" style={{ background: local }} />
        <input type="color" value={safeHex}
          onChange={(e) => handleColorChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <input type="text" value={local}
        onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) handleColorChange(e.target.value); }}
        className="w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 font-mono text-xs text-ink outline-none focus:border-accent"
        maxLength={7} />
    </div>
  );
}

// Reforma completa (2026-09-06) — antes era só sólido; agora cada role
// aceita sólido OU gradiente (ColorValue, ver types.ts/colorRoles.ts).
// Reaproveita HexSwatchInput acima pros 2 lados do gradiente.
function ColorPicker({ label, hint, value, onChange }: { label: string; hint: string; value: ColorValue; onChange: (v: ColorValue) => void }) {
  const isGradient = value.mode === "gradient";
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-ink">{label}</p>
          <p className="truncate text-xs text-muted">{hint}</p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-border text-[10px] font-black">
          <button type="button" onClick={() => !isGradient || onChange({ mode: "solid", value: value.from })} className={`px-2.5 py-1.5 transition ${!isGradient ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Sólida</button>
          <button type="button" onClick={() => isGradient || onChange({ mode: "gradient", from: value.value, to: value.value })} className={`px-2.5 py-1.5 transition ${isGradient ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>Gradiente</button>
        </div>
      </div>
      <div className="mt-2">
        {isGradient ? (
          <div className="grid grid-cols-2 gap-2">
            <HexSwatchInput value={value.from} onChange={(v) => onChange({ mode: "gradient", from: v, to: value.to })} />
            <HexSwatchInput value={value.to} onChange={(v) => onChange({ mode: "gradient", from: value.from, to: v })} />
          </div>
        ) : (
          <HexSwatchInput value={value.value} onChange={(v) => onChange({ mode: "solid", value: v })} />
        )}
      </div>
    </div>
  );
}

// Cor de partida sensata pra cada role, na primeira vez que o editor
// mostra o campo (antes de o usuário ter escolhido algo) — usa os
// valores base do tema atual (que continuam existindo como "seed"
// interno, nunca mais expostos como controle duplicado na tela).
function roleFallback(role: ColorRole, site: ToqySite): string {
  const t = site.theme;
  const map: Partial<Record<ColorRole, string>> = {
    pageBackground: t.background,
    name: t.text, title: t.muted, location: t.muted, description: t.muted, logoText: t.text,
    buttonBg: t.primary, buttonText: t.text, buttonBorder: t.primary,
    // Botões secundários e card de horário (2026-09-06, mockup da auditoria
    // externa): o padrão é card claro/neutro — o contrário do CTA, que é o
    // único preenchido com a cor cheia. Em tema escuro o "card" do tema já
    // é o tom certo pra isso.
    secondaryButtonBg: t.mode === "light" ? "#FFFFFF" : t.card,
    secondaryButtonText: t.text,
    hoursCardBg: t.mode === "light" ? "#FFFFFF" : t.card,
    hoursText: t.text,
    socialIconBg: t.primary,
    saveContactText: t.text, callText: t.text, wifiText: t.text,
    catalogSectionLabel: t.accent, catalogTitle: t.text, catalogItemBg: t.card,
    catalogItemName: t.text, catalogItemDesc: t.muted, catalogItemPrice: t.accent,
    catalogItemHighlight: "#b45309", catalogActionBg: t.primary, catalogActionText: "#ffffff",
    modalIconBg: t.primary, footerCreditText: t.primary,
  };
  return map[role] ?? t.text;
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

// Reordena um bloco de categoria inteiro pra cima/baixo dentro do catálogo
// (2026-07-16, bug real reportado com print: a categoria configurada por
// ÚLTIMO aqui em "Exibição por categoria" aparecia PRIMEIRO no bio site
// publicado — a ordem de exibição no site segue a ordem das categorias no
// catálogo, ver itemsBySection em PublicBioSite.tsx, e não existia nenhum
// jeito de mudar essa ordem). Move TODOS os itens da categoria (mantendo a
// ordem interna deles) pra antes/depois do bloco da categoria vizinha.
// Itens sem categoria (não deveria acontecer — "Adicionar item" sempre usa
// "Destaques" como padrão) ficam no início, sem entrar na reordenação.
// Reconstrói o catálogo aplicando uma ordem de categorias já pronta (ex:
// resultado de um drag) — mesma regra de reorderCategory abaixo, mas
// recebendo a ordem final direto em vez de calcular um swap de vizinhos.
function applyCategoryOrder(catalog: CatalogItem[], newOrder: string[]): CatalogItem[] {
  const grouped = new Map<string, CatalogItem[]>();
  const uncategorized: CatalogItem[] = [];
  catalog.forEach((item) => {
    const c = item.category?.trim();
    if (c) grouped.set(c, [...(grouped.get(c) ?? []), item]);
    else uncategorized.push(item);
  });
  return [...uncategorized, ...newOrder.flatMap((cat) => grouped.get(cat) ?? [])];
}

function reorderCategory(catalog: CatalogItem[], category: string, direction: "up" | "down"): CatalogItem[] {
  const categories = Array.from(new Set(catalog.map((i) => i.category?.trim()).filter((c): c is string => Boolean(c))));
  const idx = categories.indexOf(category);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapWith < 0 || swapWith >= categories.length) return catalog;
  const newOrder = [...categories];
  [newOrder[idx], newOrder[swapWith]] = [newOrder[swapWith], newOrder[idx]];
  return applyCategoryOrder(catalog, newOrder);
}

function CatalogCategoryDisplayControl({ catalog, onChangeCategory, onReorderCategory, onReorderCategories }: { catalog: CatalogItem[]; onChangeCategory: (category: string, mode: string) => void; onReorderCategory: (category: string, direction: "up" | "down") => void; onReorderCategories: (newOrder: string[]) => void }) {
  const categories = Array.from(new Set(catalog.map((i) => i.category?.trim()).filter((c): c is string => Boolean(c))));
  if (categories.length === 0) return null;
  return (
    <div className="mt-4 rounded-3xl border border-border bg-surface p-4">
      <p className="text-sm font-black text-ink">Exibição por categoria</p>
      <p className="mt-1 text-xs text-muted">Escolha como cada categoria aparece e a ORDEM dela no bio site (arraste ou use as setas) — vale pra todas as fotos dela de uma vez, não precisa configurar foto por foto.</p>
      <div className="mt-3 grid gap-2">
        <DragReorderList items={categories} itemKey={(cat) => cat} onReorder={onReorderCategories}>
          {(cat, index, drag) => (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-2">
                <DragHandle {...drag} />
                <button type="button" disabled={index === 0} onClick={() => onReorderCategory(cat, "up")} className="rounded-lg border border-border p-1.5 text-muted hover:text-ink disabled:opacity-30" aria-label={`Mover ${cat} para cima`}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" disabled={index === categories.length - 1} onClick={() => onReorderCategory(cat, "down")} className="rounded-lg border border-border p-1.5 text-muted hover:text-ink disabled:opacity-30" aria-label={`Mover ${cat} para baixo`}><ArrowDown className="h-3.5 w-3.5" /></button>
                <span className="text-sm font-black text-ink">{cat}</span>
              </div>
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
          )}
        </DragReorderList>
      </div>
      {categories.some((cat) => categoryCommonDisplaySection(catalog, cat) === "subcategorias") ? (
        <p className="mt-3 text-xs text-muted">
          Categoria em &quot;Subcategorias&quot;: preencha o campo <b>Subcategoria</b> em cada foto (ex: &quot;Cadeiras&quot;, &quot;Mesas&quot;, &quot;Estantes&quot;) — cada subcategoria vira sua própria capa, lado a lado, e clicar abre só as fotos dela.
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
function BulkCatalogPhotoAdd({ slug, catalog, onAdd, editKey }: { slug: string; catalog: CatalogItem[]; onAdd: (items: CatalogItem[]) => void; editKey?: string }) {
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
        const imageUrl = await uploadImageFile(file, slug, `catalog-bulk-${generateId("img")}`, editKey);
        newItems.push({
          id: generateId("prd"),
          name: "",
          description: "",
          price: "",
          imageUrl,
          imageLayout: "square",
          imageFit: "cover",
          imagePosition: "center",
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
      <p className="mt-1 text-xs text-muted">Escolha a categoria (ex: &quot;Diretoria&quot;) e suba várias fotos de uma vez, sem precisar preencher nome/descrição em cada uma. Entram no mesmo modo de exibição que a categoria já usa.</p>
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
  // Compartilhar com QR direto do editor (2026-09-06, pedido do Leonardo
  // depois de analisar o app do Linktree: lá existe um botão de
  // compartilhar acessível em QUALQUER tela do editor, não só no fim do
  // fluxo — o Toqy já tinha QR/link/WhatsApp na última etapa ("Salvar"),
  // isso só adianta o acesso pra qualquer momento da edição).
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [limitState, setLimitState] = useState<{ current: number; limit: number; planTier: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const publicLink = createPublicUrl(site.slug);

  // Bug real corrigido (2026-09-06, achado ao vivo pelo Leonardo: conta no
  // plano Agência via "Disponível a partir do plano Pro" no lugar dos
  // campos de figurinha/música). Causa: o gate usava `limitState`, que só é
  // preenchido dentro de save() em modo "create" E só quando o limite de
  // bio sites é ATINGIDO — fora desse caso (a imensa maioria do tempo,
  // incluindo SEMPRE no modo "edit") `limitState` é `null`, e
  // `resolvePlanTier(undefined)` cai em "free". Busca o plano de verdade
  // uma vez, ao montar, independente do fluxo de limite de sites.
  const [ownerPlanTier, setOwnerPlanTier] = useState<PlanType>("free");
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !active) return;
      const { data: profile } = await supabase.from("profiles").select("plan_toqy, plan_tier").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      setOwnerPlanTier(resolvePlanTier(profile?.plan_toqy ?? profile?.plan_tier));
    })();
    return () => { active = false; };
  }, []);

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
  // White label (2026-09-06) — patch parcial igual aos outros setters; o
  // objeto inteiro é opcional em ToqySite, então começa vazio.
  function setWhiteLabel(patch: Partial<NonNullable<ToqySite["whiteLabel"]>>) { update((s) => ({ ...s, whiteLabel: { ...s.whiteLabel, ...patch } })); }
  function setColor(key: ColorRole, value: ColorValue) { update((s) => ({ ...s, theme: { ...s.theme, colors: { ...s.theme.colors, [key]: value } } })); }
  // Horário de funcionamento (2026-09-06, mockup da auditoria externa) —
  // ao ligar pela primeira vez, semeia os 7 dias com a sugestão padrão;
  // depois disso só faz patch. Sempre grava os 7 dias pra o site público
  // nunca precisar adivinhar o que fazer com um dia ausente.
  function setBusinessHours(patch: Partial<NonNullable<ToqySite["businessHours"]>>) {
    update((s) => ({ ...s, businessHours: { enabled: false, days: defaultBusinessHoursDays(), ...s.businessHours, ...patch } }));
  }
  function setBusinessHoursDay(weekday: number, patch: Partial<BusinessHoursDay>) {
    update((s) => {
      const current = s.businessHours ?? { enabled: true, days: defaultBusinessHoursDays() };
      const days = (current.days.length ? current.days : defaultBusinessHoursDays()).map((day) => day.weekday === weekday ? { ...day, ...patch } : day);
      return { ...s, businessHours: { ...current, days } };
    });
  }
  // Arrastar figurinha no preview ao vivo (2026-09-06) — chamado a cada
  // pointermove pelo PublicBioSite quando `onStickerMove` é passado (só
  // acontece aqui no editor; o bio site público de verdade nunca recebe
  // essa prop, então nunca fica arrastável pro visitante).
  function handleStickerMove(id: string, x: number, y: number) {
    update((s) => ({ ...s, stickers: (s.stickers ?? []).map((st) => (st.id === id ? { ...st, x, y } : st)) }));
  }
  // Normaliza pra ColorValue mesmo se o site foi salvo antes da reforma
  // (valor antigo era string simples — vira sólido automaticamente).
  function getColor(key: ColorRole, fallback: string): ColorValue {
    const raw = site.theme.colors?.[key] as ColorValue | string | undefined;
    if (raw === undefined) return { mode: "solid", value: fallback };
    return typeof raw === "string" ? { mode: "solid", value: raw } : raw;
  }

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
                editKey={site.editKey}
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
              <p className="mt-1 text-xs text-muted">PNG com fundo transparente → use &quot;Mostrar completa&quot;. Foto → use &quot;Preencher&quot;.</p>
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
                editKey={site.editKey}
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

          {/* HORÁRIO DE FUNCIONAMENTO (2026-09-06, mockup da auditoria
              externa) — card "Aberto hoje • 7h às 18h" com selo verde no
              bio site. Sem gate de plano de propósito: horário é informação
              básica de negócio local, vale até no Gratuito. Desligado por
              padrão — bio site que não mexer aqui continua idêntico. */}
          <div className="mt-5 rounded-3xl border border-border bg-surface p-5">
            <p className="text-sm font-black text-ink">🕒 Horário de funcionamento</p>
            <p className="mt-0.5 text-xs text-muted">Mostra um card com o horário de hoje, o endereço e um selo “Aberto”/“Fechado” calculado na hora que o cliente abre o link.</p>
            <label className="mt-3 flex items-center gap-2 text-sm font-black text-ink">
              <input type="checkbox" checked={Boolean(site.businessHours?.enabled)} onChange={(e) => setBusinessHours({ enabled: e.target.checked })} />
              Mostrar horário no bio site
            </label>
            {site.businessHours?.enabled ? (
              <div className="mt-4 space-y-2">
                {WEEKDAY_EDIT_ORDER.map((weekday) => {
                  const day = site.businessHours?.days.find((item) => item.weekday === weekday) ?? { weekday, closed: true, open: "09:00", close: "18:00" };
                  return (
                    <div key={weekday} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
                      <span className="w-32 shrink-0 text-sm font-black text-ink">{WEEKDAY_LABELS[weekday]}</span>
                      <label className="flex items-center gap-2 text-xs font-black text-muted">
                        <input type="checkbox" checked={day.closed} onChange={(e) => setBusinessHoursDay(weekday, { closed: e.target.checked })} />
                        Fechado
                      </label>
                      {day.closed ? null : (
                        <div className="flex items-center gap-2">
                          <input type="time" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent" value={day.open} onChange={(e) => setBusinessHoursDay(weekday, { open: e.target.value })} />
                          <span className="text-xs font-black text-muted">às</span>
                          <input type="time" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-accent" value={day.close} onChange={(e) => setBusinessHoursDay(weekday, { close: e.target.value })} />
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs text-muted">Vira a madrugada? É só colocar o fechamento menor que a abertura — ex: 18:00 às 02:00.</p>
              </div>
            ) : null}
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
            <label><span className={label}>Ícone nos botões</span><select className={field} value={site.theme.mainButtonDisplay ?? "icon-text"} onChange={(e) => setTheme({ mainButtonDisplay: e.target.value as "icon-text" | "text-only" })}><option value="icon-text">Ícone + texto</option><option value="text-only">Só texto</option></select></label>
            <label><span className={label}>Preenchimento</span><select className={field} value={site.theme.buttonFill} onChange={(e) => setTheme({ buttonFill: e.target.value as ToqySite["theme"]["buttonFill"] })}><option value="glass">Translúcido premium</option><option value="solid">Sólido</option><option value="gradient">Gradiente</option></select></label>
            <label><span className={label}>Formato</span><select className={field} value={site.theme.buttonRadius} onChange={(e) => setTheme({ buttonRadius: e.target.value as ToqySite["theme"]["buttonRadius"] })}><option value="soft">Soft</option><option value="rounded">Arredondado</option><option value="pill">Pill/cápsula</option></select></label>
            <label><span className={label}>Ícones sociais (WhatsApp, Instagram...)</span><select className={field} value={site.theme.socialIconStyle ?? "brand"} onChange={(e) => setTheme({ socialIconStyle: e.target.value as "brand" | "glass" })}><option value="brand">Cores reais das marcas</option><option value="glass">Translúcido (igual botões)</option></select></label>
            <label><span className={label}>Tamanho dos ícones (WhatsApp, Instagram, Facebook, localização)</span><select className={field} value={site.theme.socialIconSize ?? "md"} onChange={(e) => setTheme({ socialIconSize: e.target.value as "sm" | "md" | "lg" })}><option value="sm">Pequeno</option><option value="md">Médio</option><option value="lg">Grande</option></select></label>
            <label><span className={label}>Tamanho do título (nome do negócio)</span><select className={field} value={site.theme.nameFontSize ?? "md"} onChange={(e) => setTheme({ nameFontSize: e.target.value as "sm" | "md" | "lg" })}><option value="sm">Pequeno</option><option value="md">Médio</option><option value="lg">Grande</option></select>
              <label className="mt-2 flex items-center gap-1.5 text-xs font-black text-ink">
                <input type="checkbox" checked={site.theme.nameShadow !== false} onChange={(e) => setTheme({ nameShadow: e.target.checked })} />
                Sombra no título
              </label>
            </label>
            <label><span className={label}>Alinhamento da localização</span><select className={field} value={site.theme.locationAlign ?? "left"} onChange={(e) => setTheme({ locationAlign: e.target.value as "left" | "center" })}><option value="left">Esquerda (recomendado p/ endereços longos)</option><option value="center">Centralizado</option></select></label>
            <label className="md:col-span-2">
              <span className={label}>Imagem de fundo</span>
              <div className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>💡 Dica para melhor resultado:</strong> Use imagem <strong>1080×1920px</strong> (formato celular). A imagem fica fixa e o conteúdo rola por cima — ela não vai esticar.
              </div>
              <ImageUploadField
                label=""
                value={site.profile.backgroundImageUrl}
                onChange={(url) => setProfile({ backgroundImageUrl: url })}
                placeholder="URL da imagem de fundo"
                slug={site.slug}
                fieldId="background"
                editKey={site.editKey}
                showPositionControl
                position={site.profile.backgroundImagePosition ?? "center"}
                onPositionChange={(pos) => setProfile({ backgroundImagePosition: pos })}
              />
              {/* Reposicionamento (2026-09-06, resolve o "tela corta" achado
                  ao vivo em toqy.com.br/b/yakisabor) — antes o fundo usava
                  sempre "centro/topo" fixo, cortando texto de imagens que
                  não foram desenhadas pra proporção de celular. */}
              <ImageGuidelineHint type="background" />
              <label className="mt-2 flex items-center gap-1.5 text-xs font-black text-ink">
                <input type="checkbox" checked={site.theme.useBackgroundOverlay} onChange={(e) => setTheme({ useBackgroundOverlay: e.target.checked })} />
                Escurecer levemente a imagem (ajuda a ler o texto por cima, mas pode deixar a cor original mais acinzentada)
              </label>
            </label>
          </div>

          {/* Reforma completa (2026-09-06, pedido do Leonardo: "remove
              tudo que for configuração de cor e refaça um por um... cada
              lugar tem que ter como mudar a cor individual, tanto sólida
              quanto gradiente"). Causa raiz do "muitos lugares
              repetidos": antes coexistiam um sistema "global" (theme.
              primary/text/muted/accent/card, editável direto aqui) E um
              granular por elemento — o mesmo conceito aparecia em 2
              controles diferentes (ex: "Cor dos botões" E "Fundo dos
              botões" eram a mesma coisa, "Fundo dos cards" existia 2x).
              Agora existe 1 controle por lugar reconhecível do biosite,
              cada um sólido OU gradiente (ver COLOR_ROLES em
              src/lib/colorRoles.ts pra lista completa) — nada de campo
              "global" separado escondendo qual controle realmente manda. */}
          <div className="mt-5 space-y-4">
            {Object.entries(
              Object.entries(COLOR_ROLES).reduce<Record<string, ColorRole[]>>((acc, [role, meta]) => {
                acc[meta.group] = [...(acc[meta.group] ?? []), role as ColorRole];
                return acc;
              }, {})
            ).map(([group, roles]) => (
              <div key={group} className="rounded-3xl border border-border bg-surface p-5">
                <p className="text-sm font-black text-ink">{group}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    // Modo translúcido/glass já é automático (ver
                    // buttonStyle/social icon em PublicBioSite.tsx) —
                    // esconder o controle de cor de fundo evita a pessoa
                    // configurar uma cor que não vai aparecer.
                    if (role === "buttonBg" && site.theme.buttonFill !== "solid") return null;
                    const meta = COLOR_ROLES[role];
                    return <ColorPicker key={role} label={meta.label} hint={meta.hint} value={getColor(role, roleFallback(role, site))} onChange={(v) => setColor(role, v)} />;
                  })}
                </div>
                {group === "Botões" && site.theme.buttonFill !== "solid" ? (
                  <p className="mt-3 rounded-xl bg-card p-3 text-xs text-muted">Preenchimento é <strong>{site.theme.buttonFill === "glass" ? "Translúcido" : "Gradiente"}</strong> (ver etapa acima) — nesse modo o fundo dos botões é automático. Mude pra <strong>Sólido</strong> pra escolher a cor/gradiente aqui.</p>
                ) : null}
                {group === "Ícones sociais" ? (
                  <label className="mt-3 flex items-center gap-1.5 text-xs font-black text-ink">
                    <input type="checkbox" checked={Boolean(site.theme.socialIconTranslucent)} onChange={(e) => setTheme({ socialIconTranslucent: e.target.checked })} />
                    Fundo translúcido (efeito vidro fosco)
                  </label>
                ) : null}
              </div>
            ))}
          </div>

          {/* FIGURINHAS + MÚSICA + INSTAGRAM (2026-09-05/06, pedido do
              Leonardo) — liberado a partir do Pro Pessoal e planos de
              revenda, exceto Essencial (ver hasStickersAndMusic em
              subscriptions.ts). Figurinhas com posição livre arrastável no
              preview ao lado (igual Canva); música com upload de verdade
              (hospedado no Toqy); Instagram vira um bloco reordenável
              (ver "Ordem das seções" logo abaixo). */}
          <div className="mt-5 rounded-3xl border border-border bg-surface p-5">
            <p className="text-sm font-black text-ink">✨ Figurinhas, música e Instagram</p>
            <p className="mt-0.5 text-xs text-muted">Dê mais personalidade ao bio site.</p>
            {canUseStickersAndMusic(ownerPlanTier) ? (
              <div className="mt-4 space-y-5">
                <div>
                  <p className={label}>Figurinhas (até 3) — arraste no preview ao lado pra posicionar</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STICKER_LIBRARY.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        title={s.label}
                        disabled={(site.stickers ?? []).length >= 3}
                        onClick={() => update((cur) => ({
                          ...cur,
                          stickers: [...(cur.stickers ?? []), { id: generateId("sticker"), key: s.key, x: 50 + ((cur.stickers?.length ?? 0) * 12 - 12), y: 8, size: "md" as const, rotation: (cur.stickers?.length ?? 0) % 2 === 0 ? -8 : 8 }],
                        }))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-2xl transition hover:border-accent disabled:opacity-30"
                      >
                        <StickerIcon stickerKey={s.key} className="h-7 w-7" />
                      </button>
                    ))}
                  </div>
                  {(site.stickers ?? []).length ? (
                    <div className="mt-3 space-y-2">
                      {(site.stickers ?? []).map((sticker) => (
                        <div key={sticker.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
                          <StickerIcon stickerKey={sticker.key} className="h-6 w-6 shrink-0" />
                          <select className="flex-1 rounded-xl border border-border bg-surface px-2 py-1.5 text-xs" value={sticker.size} onChange={(e) => update((s) => ({ ...s, stickers: (s.stickers ?? []).map((st) => (st.id === sticker.id ? { ...st, size: e.target.value as typeof st.size } : st)) }))}>
                            <option value="sm">Pequena</option>
                            <option value="md">Média</option>
                            <option value="lg">Grande</option>
                          </select>
                          <button type="button" onClick={() => update((s) => ({ ...s, stickers: (s.stickers ?? []).filter((st) => st.id !== sticker.id) }))} className="shrink-0 text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {/* Música de fundo (2026-09-06, 2ª revisão — o Leonardo
                    testou o player visível e pediu pra tirar: "tire o de
                    deixar o player da música aparecendo"). Toca sozinha,
                    sem controles visíveis, no volume escolhido aqui —
                    ver BackgroundMusicPlayer em PublicBioSite.tsx. */}
                <div>
                  <span className={label}>Música de fundo</span>
                  <p className="mt-0.5 text-xs text-muted">Toca sozinha quando a pessoa abre o biosite, sem player visível.</p>
                  <div className="mt-2">
                    <AudioUploadField value={site.backgroundMusicUrl ?? site.musicUrl} onChange={(url) => update((s) => ({ ...s, backgroundMusicUrl: url, musicUrl: undefined }))} slug={site.slug} editKey={site.editKey} />
                  </div>
                  {(site.backgroundMusicUrl ?? site.musicUrl) ? (
                    <label className="mt-3 block">
                      <span className="text-xs font-black text-ink">Volume ({site.backgroundMusicVolume ?? 40}%)</span>
                      <input type="range" min={0} max={100} value={site.backgroundMusicVolume ?? 40} onChange={(e) => update((s) => ({ ...s, backgroundMusicVolume: Number(e.target.value) }))} className="mt-1 w-full accent-accent" />
                    </label>
                  ) : null}
                </div>
                {/* Botão do Spotify (2026-09-06) — molde do "Music Link" do
                    Linktree: link direto pra uma faixa/álbum (sem conectar
                    conta), com label editável e 3 formatos de exibição. */}
                <div>
                  <span className={label}>Botão do Spotify</span>
                  <p className="mt-0.5 text-xs text-muted">Link direto de uma faixa, álbum ou playlist do Spotify.</p>
                  <input className={`${field}`} value={site.spotifyUrl ?? ""} onChange={(e) => update((s) => ({ ...s, spotifyUrl: e.target.value }))} placeholder="https://open.spotify.com/track/..." />
                  {site.spotifyUrl ? (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <label><span className="text-xs font-black text-ink">Texto do botão</span><input className={field} value={site.spotifyLabel ?? ""} onChange={(e) => update((s) => ({ ...s, spotifyLabel: e.target.value }))} placeholder="Ouça minha música" /></label>
                      <label><span className="text-xs font-black text-ink">Formato</span><select className={field} value={site.spotifyDisplay ?? "button"} onChange={(e) => update((s) => ({ ...s, spotifyDisplay: e.target.value as "icon" | "button" | "preview" }))}><option value="button">Botão com texto</option><option value="icon">Só ícone</option><option value="preview">Prévia embutida</option></select></label>
                    </div>
                  ) : null}
                </div>
                <div>
                  <span className={label}>Posts do Instagram (adicione quantos quiser)</span>
                  <div className="mt-2 space-y-2">
                    {(site.instagramPosts ?? []).map((post) => (
                      <div key={post.id} className="flex items-center gap-2">
                        <input
                          className={`${field} mt-0 min-w-0 flex-1`}
                          value={post.url}
                          onChange={(e) => update((s) => ({ ...s, instagramPosts: (s.instagramPosts ?? []).map((p) => (p.id === post.id ? { ...p, url: e.target.value } : p)) }))}
                          placeholder="https://www.instagram.com/p/XXXXXXX/"
                        />
                        {/* Tamanho por post (2026-09-06, 2ª revisão — o
                            Leonardo testou e reportou "estão de vários
                            tamanhos, poderia escolher": antes era 1
                            tamanho pra TODOS os posts do bloco; cada
                            post tem sua própria proporção no embed da
                            Meta mesmo com a mesma largura, então faz
                            mais sentido cada um escolher o seu. */}
                        {/* Bug real corrigido (2026-09-06): `field` já
                            traz "w-full" — combinado com "w-28" aqui,
                            as 2 classes de largura competem com a MESMA
                            especificidade CSS, e o navegador não segue
                            a ordem em que aparecem no atributo className
                            (só a ordem em que o Tailwind gerou as
                            regras). Resultado ao vivo: o select tentava
                            ocupar 100% da linha, espremendo o campo de
                            URL ao lado até virar só uma bolinha. Agora o
                            select tem classes próprias, sem herdar
                            "w-full" de lugar nenhum. */}
                        <select
                          className="mt-0 w-28 shrink-0 rounded-2xl border border-border bg-card px-2 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                          value={post.size ?? "md"}
                          onChange={(e) => update((s) => ({ ...s, instagramPosts: (s.instagramPosts ?? []).map((p) => (p.id === post.id ? { ...p, size: e.target.value as "sm" | "md" | "lg" } : p)) }))}
                        >
                          <option value="sm">Pequeno</option>
                          <option value="md">Médio</option>
                          <option value="lg">Grande</option>
                        </select>
                        <button type="button" onClick={() => update((s) => ({ ...s, instagramPosts: (s.instagramPosts ?? []).filter((p) => p.id !== post.id) }))} className="shrink-0 text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => update((s) => ({ ...s, instagramPosts: [...(s.instagramPosts ?? []), { id: generateId("ig"), url: "" }] }))}
                      className="inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-2.5 text-sm font-black text-muted hover:border-accent hover:text-accent"
                    >
                      <Plus className="h-4 w-4" /> Adicionar post
                    </button>
                  </div>
                  {(site.instagramPosts ?? []).length ? (
                    <div className="mt-3">
                      {/* Só "Layout" aqui — o tamanho agora é por post,
                          escolhido junto de cada URL acima (2ª revisão,
                          2026-09-06). "Carrossel" virou slide de verdade:
                          1 post por vez, com bolinhas de navegação, sem
                          rolar sozinho (era o que o Leonardo reportou
                          como "ficou muito feio"). */}
                      <label><span className="text-xs font-black text-ink">Layout</span><select className={field} value={site.instagramLayout ?? "carousel"} onChange={(e) => update((s) => ({ ...s, instagramLayout: e.target.value as "carousel" | "list" }))}><option value="carousel">Slide (1 por vez, com navegação)</option><option value="list">Lista (um embaixo do outro)</option></select></label>
                    </div>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">Cada post aparece embutido e ao vivo (curtidas/comentários atualizados pelo próprio Instagram). Não puxa automaticamente do perfil — cole o link de cada post que quiser mostrar.</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-violet/20 bg-violet/10 p-4 text-sm font-bold text-violet">
                {/* Navegação interna (2026-09-06, auditoria externa): era <a href> cru pra home, agora <Link> */}
                Disponível a partir do plano Pro. <Link href="/#planos" className="underline">Ver planos</Link>
              </div>
            )}
          </div>

          {/* ORDEM DAS SEÇÕES (2026-09-06, pedido do Leonardo: "o Toqy não
              pode prender as pessoas a uma coisa só") — arrasta pra
              intercalar botões, horário, catálogo, música e Instagram na
              ordem que quiser. Título/localização/descrição/QR/telefone
              continuam padronizados (não entram nesta lista).
              resolveBodyBlockOrder garante que quem salvou a ordem antes do
              bloco "horário" existir também o veja aqui, na posição padrão
              dele, sem perder o arranjo que já tinha. */}
          <div className="mt-5 rounded-3xl border border-border bg-surface p-5">
            <p className="text-sm font-black text-ink">↕️ Ordem das seções</p>
            <p className="mt-0.5 text-xs text-muted">Arraste pra decidir o que aparece primeiro: botões, horário, catálogo, música ou Instagram.</p>
            <div className="mt-3 space-y-2">
              <DragReorderList
                items={resolveBodyBlockOrder(site.bodyBlockOrder)}
                itemKey={(item) => item}
                onReorder={(next) => update((s) => ({ ...s, bodyBlockOrder: next }))}
              >
                {(item, _index, drag) => (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
                    <DragHandle {...drag} />
                    <span className="text-sm font-black text-ink">{BODY_BLOCK_LABELS[item]}</span>
                  </div>
                )}
              </DragReorderList>
            </div>
          </div>

          {/* WHITE LABEL (2026-09-06, pedido do primeiro assinante do plano
              Agência) — histórico: o white label existiu e foi REMOVIDO do
              produto em 2026-09-01 (decisão do Leonardo). Voltou agora,
              revisto a pedido de cliente pagante real que revende bio sites
              pros clientes dele e precisa entregar com a marca da própria
              agência. EXCLUSIVO do plano Agência (ver hasWhiteLabel em
              subscriptions.ts).

              Este gate aqui é só conveniência de UI — quem realmente decide
              se o selo some é o site público (PublicBioSite.tsx), que checa
              site.ownerPlan gravado pelo servidor. */}
          <div className="mt-5 rounded-3xl border border-border bg-surface p-5">
            <p className="text-sm font-black text-ink">🏷️ Sua marca no rodapé (white label)</p>
            <p className="mt-0.5 text-xs text-muted">Entregue o bio site com a marca da sua empresa no lugar do selo do Toqy.</p>
            {canUseWhiteLabel(ownerPlanTier) ? (
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-black text-ink">
                  <input type="checkbox" checked={Boolean(site.whiteLabel?.hideToqyBadge)} onChange={(e) => setWhiteLabel({ hideToqyBadge: e.target.checked })} />
                  Esconder o selo &quot;Criado com TOQY&quot;
                </label>
                {site.whiteLabel?.hideToqyBadge ? (
                  <div className="space-y-4">
                    <label className="block">
                      <span className={label}>Nome da empresa</span>
                      <input className={field} value={site.whiteLabel?.brandName ?? ""} onChange={(e) => setWhiteLabel({ brandName: e.target.value })} placeholder="Ex: Studio Criativo" />
                    </label>
                    <div>
                      <span className={label}>Logo da empresa</span>
                      <p className="mb-2 text-xs text-muted">Aparece pequena no rodapé, ao lado do nome. Use PNG com fundo transparente.</p>
                      <ImageUploadField
                        label=""
                        value={site.whiteLabel?.brandLogoUrl}
                        onChange={(url) => setWhiteLabel({ brandLogoUrl: url })}
                        placeholder="URL da logo da empresa"
                        slug={site.slug}
                        fieldId="white-label-logo"
                        editKey={site.editKey}
                      />
                    </div>
                    <label className="block">
                      <span className={label}>Link do seu site (opcional)</span>
                      <input className={field} value={site.whiteLabel?.brandUrl ?? ""} onChange={(e) => setWhiteLabel({ brandUrl: e.target.value })} placeholder="https://suaempresa.com.br" />
                    </label>
                    {/* Mesmo padrão seguro do rodapé público: sem nome nem
                        logo não dá pra esconder o selo, senão o rodapé
                        ficaria vazio. Avisa aqui pra pessoa não achar que
                        salvou e não funcionou. */}
                    {!(site.whiteLabel?.brandName?.trim() || site.whiteLabel?.brandLogoUrl?.trim()) ? (
                      <p className="rounded-xl bg-card p-3 text-xs text-muted">Preencha o nome da empresa ou envie a logo pra substituir o selo. Enquanto não tiver nenhum dos dois, o selo do Toqy continua aparecendo.</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-violet/20 bg-violet/10 p-4 text-sm font-bold text-violet">
                Disponível apenas no plano Agência. <Link href="/#planos" className="underline">Ver planos</Link>
              </div>
            )}
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
                <p className="font-black text-slate-800">Botão &quot;Salvar Contato&quot;</p>
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
            <button type="button" onClick={() => update((s) => ({ ...s, catalog: [...s.catalog, { id: generateId("prd"), name: "", description: "", price: "", imageUrl: "", imageLayout: "square", imageFit: "cover", imagePosition: "center", category: "Destaques", enabled: true, actionLabel: "", actionUrl: "" }] }))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Adicionar item</button>
          </div>

          <div className="mt-4">
            <BulkCatalogPhotoAdd slug={site.slug} catalog={site.catalog} onAdd={(items) => update((s) => ({ ...s, catalog: [...s.catalog, ...items] }))} editKey={site.editKey} />
          </div>

          {/* Card promo editavel */}
          <div className="mt-5 rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className={label}>Card &quot;Mais praticidade...&quot;</span>
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
            <p className="mb-3 mt-1 text-xs text-muted">Vale pras categorias que não tiverem uma exibição específica escolhida no painel &quot;Exibição por categoria&quot; abaixo.</p>
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
            onReorderCategory={(cat, direction) => update((s) => ({ ...s, catalog: reorderCategory(s.catalog, cat, direction) }))}
            onReorderCategories={(newOrder) => update((s) => ({ ...s, catalog: applyCategoryOrder(s.catalog, newOrder) }))}
          />

          <div className="mt-5 grid gap-4">
            <DragReorderList items={site.catalog} itemKey={(item) => item.id} onReorder={(next) => update((s) => ({ ...s, catalog: next }))}>
              {(item, index, drag) => (
              <article className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                {/* Header do item com reordenação */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DragHandle {...drag} />
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
                    <p className="mt-1 text-xs text-muted">Só faz efeito se a categoria estiver com exibição &quot;Subcategorias&quot; (ver painel acima).</p>
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
                  <label>
                    <span className={label}>Formato da foto</span>
                    <select
                      className={field}
                      value={item.imageLayout}
                      onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageLayout: e.target.value as typeof item.imageLayout }) }))}
                    >
                      <option value="square">Quadrada</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical / Moda</option>
                    </select>
                  </label>
                  <label>
                    <span className={label}>Exibição da imagem</span>
                    <select
                      className={field}
                      value={item.imageFit ?? "cover"}
                      onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageFit: e.target.value as "cover" | "contain" }) }))}
                    >
                      <option value="cover">Preencher card</option>
                      <option value="contain">Mostrar imagem inteira</option>
                    </select>
                  </label>
                  <label><span className={label}>Badge / Destaque</span><input className={field} placeholder='Ex: "Mais vendido", "Novidade"' value={item.highlight ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { highlight: e.target.value }) }))} /></label>
                  <label className="md:col-span-2"><span className={label}>Descrição (opcional)</span><textarea className={field} rows={2} placeholder="Deixe vazio pra mostrar só a foto, sem texto" value={item.description} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { description: e.target.value }) }))} /></label>
                </div>
                <div className="mt-3">
                  <ImageUploadField
                    label="Imagem do item"
                    value={item.imageUrl}
                    onChange={(url) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imageUrl: url }) }))}
                    slug={site.slug}
                    fieldId={`catalog-${item.id}`}
                    editKey={site.editKey}
                    cropAspectRatio={item.imageLayout === "square" ? "square" : item.imageLayout === "vertical" ? "4:5" : "16:9"}
                    showPositionControl
                    position={item.imagePosition ?? "center"}
                    onPositionChange={(pos) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { imagePosition: pos }) }))}
                  />
                  <ImageGuidelineHint type={item.imageLayout === "square" ? "productSquare" : item.imageLayout === "vertical" ? "productVertical" : "productHorizontal"} />
                  <p className="mt-2 text-xs font-semibold text-muted">
                    Agora você pode recortar a foto antes de salvar e escolher se quer preencher o card ou mostrar a imagem inteira.
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input className={field} placeholder="Texto do botão (ex: Agendar)" value={item.actionLabel ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionLabel: e.target.value }) }))} />
                  <input className={field} placeholder="Link do botão (opcional)" value={item.actionUrl ?? ""} onChange={(e) => update((s) => ({ ...s, catalog: updateCatalogItem(s.catalog, index, { actionUrl: e.target.value }) }))} />
                </div>
              </article>
              )}
            </DragReorderList>
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
              <span className="text-sm font-black text-ink mb-1 block">Texto do rodapé — &quot;Não encontrou?&quot;</span>
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
        {limitState ? <div className="mt-4 rounded-[1.75rem] border border-violet/20 bg-gradient-to-br from-violet/10 via-card to-surface p-5 shadow-sm"><p className="text-lg font-black text-ink">Você atingiu o limite do plano gratuito. Faça upgrade!</p><p className="mt-2 text-sm font-medium leading-relaxed text-muted">Seu plano <span className="font-black text-violet">{limitState.planTier}</span> permite até <span className="font-black text-ink">{limitState.limit}</span> biosites e você já possui <span className="font-black text-ink">{limitState.current}</span>.</p><div className="mt-4 flex flex-wrap gap-3">
          {limitState.planTier === "freelancer" ? (
            // Cobrança de excedente (2026-07-17) — só Freelancer, Agência já
            // tem limite generoso (100 sites). Ver OVERAGE_LINKS em subscriptions.ts.
            <a href={OVERAGE_LINKS.biosite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-600 transition hover:bg-emerald-500/20">Comprar mais 1 por R$5,99</a>
          ) : null}
          <Link href="/#planos" className="inline-flex items-center justify-center rounded-2xl bg-violet px-5 py-3 text-sm font-black text-white transition hover:opacity-90">Ver planos e fazer upgrade</Link><Link href="/app" className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink transition hover:border-violet/30 hover:text-violet">Voltar para meus biosites</Link></div></div> : null}
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

  // Checklist de configuração com % de progresso (2026-09-06, inspirado no
  // "Sua lista de configuração 5/6" do app do Linktree que o Leonardo
  // mandou) — 100% DERIVADO de campos que já existem em ToqySite, sem
  // nenhum campo novo no banco: só reflete o que já foi preenchido.
  const checklistItems = [
    { label: "Nome do negócio", done: Boolean(site.profile.name && site.profile.name !== "Novo negócio") },
    { label: "Descrição", done: Boolean(site.profile.description?.trim()) },
    { label: "Foto de perfil ou logo", done: Boolean(site.profile.profileImageUrl || site.profile.logoUrl) },
    { label: "Pelo menos 1 rede social", done: Boolean(site.contact.instagram || site.contact.facebook || site.contact.whatsapp) },
    { label: "Pelo menos 1 botão ativo", done: site.buttons.some((b) => b.enabled) },
  ];
  const checklistDone = checklistItems.filter((i) => i.done).length;
  const checklistPercent = Math.round((checklistDone / checklistItems.length) * 100);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        <div className="mb-5 rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-accent">TOQY Builder</p><h1 className="mt-2 text-3xl font-black text-ink md:text-5xl">{mode === "create" ? "Criar bio site" : "Editar bio site"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Tudo editável com preview ao vivo. Depois entregue link, QR Code e chave para o cliente.</p></div>
            {/* Bug real corrigido (2026-09-06, reportado ao vivo: "ainda ta
                cortando a tela, tenho que arrastar ou diminuir zoom no
                celular") — esta linha não tinha "flex-wrap", então em
                celulares mais estreitos (320-360px reais, mais estreitos
                que os 375px do emulador padrão) "Compartilhar" + "Salvar
                agora" lado a lado forçavam a LINHA a ficar mais larga que
                a tela, empurrando a página inteira pra permitir scroll
                horizontal — exatamente o "arrastar" que o Leonardo
                descreveu. Agora quebra linha em vez de estourar a largura. */}
            <div className="flex flex-wrap gap-2">
              {mode === "edit" ? (
                <button type="button" onClick={() => setShowShareSheet(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink transition hover:border-accent" aria-label="Compartilhar">
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
              ) : null}
              <button type="button" onClick={save} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "Salvando..." : "Salvar agora"}</button>
            </div>
          </div>
          {saved ? <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800"><CheckCircle2 className="h-5 w-5" />Salvo no navegador.</div> : null}
        </div>

        {/* Checklist de configuração (some sozinha quando chega a 100%) */}
        {checklistPercent < 100 ? (
          <div className="mb-5 rounded-[2rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-accent) ${checklistPercent}%, var(--color-border) 0)` }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-xs font-black text-ink">{checklistPercent}%</div>
              </div>
              <div>
                <p className="text-sm font-black text-ink">Sua lista de configuração — {checklistDone}/{checklistItems.length}</p>
                <p className="mt-0.5 text-xs font-semibold text-muted">Complete pra deixar o bio site pronto pra receber visitas.</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <li key={item.label} className={`flex items-center gap-2 text-xs font-bold ${item.done ? "text-muted line-through" : "text-ink"}`}>
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? "text-emerald-500" : "text-border"}`} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mb-5 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-border bg-card p-2 shadow-sm">{steps.map((item, index) => <button key={item} type="button" onClick={() => setStep(index)} className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${index === step ? "bg-accent text-white" : "text-muted hover:bg-surface"}`}>{index + 1}. {item}</button>)}</div>
        {body}
        {/* Navegação da etapa — fixa embaixo da tela no celular (pedido do
            Leonardo, 2026-09-05: criação/edição tem que ser fácil pelo
            celular, igual Linktree). Antes disso, em etapas longas (Links e
            Botões, Catálogo), o usuário precisava rolar até o fim pra achar
            "Continuar" — igual ao problema já corrigido no onboarding (ver
            src/app/onboarding/page.tsx). O botão "Salvar agora" do meio some
            no celular (linha 1140 já cobre a mesma ação lá em cima, sem
            duplicar e sem deixar a barra fixa alta demais). A partir de sm,
            volta a ser um rodapé normal com os 3 botões. */}
        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-border bg-bg/95 p-3 backdrop-blur-sm [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.5rem] sm:border sm:bg-card sm:p-3 sm:shadow-sm sm:backdrop-blur-none">
          <button type="button" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))} className="flex-1 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-black text-ink disabled:opacity-40 sm:flex-none sm:py-3">Voltar</button>
          <div className="flex flex-1 gap-3 sm:flex-none">
            {/* Bug real corrigido (2026-09-06, reportado ao vivo: "o botão
                salvar... aparece só no topo, não em todo o editor, pra
                facilitar") — antes esse botão era "hidden sm:inline-flex",
                ou seja, some completamente no celular; só sobrava o
                "Salvar agora" lá em cima (linha ~1399), que exige rolar de
                volta ao topo em etapas longas (Catálogo, Links e Botões).
                Agora fica sempre visível na barra fixa — só ícone no
                celular (economiza espaço ao lado de "Voltar"/"Continuar"),
                com o texto completo a partir de sm. */}
            <button type="button" onClick={save} disabled={isSaving} aria-label="Salvar agora" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-3.5 py-3 text-sm font-black text-accent-dim disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"><Save className="h-4 w-4" /><span className="hidden sm:inline">{isSaving ? "Salvando..." : "Salvar agora"}</span></button>
            <button type="button" onClick={() => step < steps.length - 1 ? setStep((v) => v + 1) : save()} disabled={isSaving} className="flex-1 rounded-2xl bg-accent px-5 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:py-3">{step < steps.length - 1 ? "Continuar" : isSaving ? "Salvando..." : "Salvar e publicar"}</button>
          </div>
        </div>
        {/* Espaçador — compensa a altura da barra fixa no celular, some a
            partir de sm (a barra deixa de ser fixa). */}
        <div className="h-20 sm:hidden" aria-hidden="true" />
      </div>
      <LiveBioSitePreview site={site} onStickerMove={handleStickerMove} />

      {/* Botão flutuante de preview no mobile — levantado (bottom-24) pra não
          ficar embaixo da barra fixa de navegação da etapa, acima. */}
      <div className="fixed bottom-24 right-6 z-30 xl:hidden">
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
          <div className="flex-1 overflow-y-auto"><PublicBioSite site={site} onStickerMove={handleStickerMove} /></div>
        </div>
      ) : null}

      {/* Bottom-sheet "Compartilhar" (2026-09-06) — QR + copiar link
          acessíveis de qualquer etapa do editor, sem precisar chegar até
          a etapa "Salvar" pra pegar essas informações de novo. */}
      {showShareSheet ? (
        <>
          <div className="fixed inset-0 z-[70] bg-ink/40" onClick={() => setShowShareSheet(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[80] rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <p className="text-lg font-black text-ink">Compartilhe seu Toqy</p>
              <button type="button" onClick={() => setShowShareSheet(false)} className="text-muted hover:text-ink" aria-label="Fechar"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <QRCodeSVG value={typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink} size={160} />
              </div>
              <p className="break-all text-center text-sm font-bold text-ink">{typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => copy(typeof window !== "undefined" ? `${window.location.origin}${publicLink}` : publicLink, "share-link")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink transition hover:border-accent">
                <Copy className="h-4 w-4" />{copied === "share-link" ? "Copiado!" : "Copiar link"}
              </button>
              <Link href={publicLink} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white transition hover:opacity-90">
                Abrir <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
