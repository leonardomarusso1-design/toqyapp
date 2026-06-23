"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ToqySite } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { syncBiositeToSupabase } from "@/lib/biositeSync";
import { generateEditKey, generateId, generateSlug } from "@/lib/security";
import { DashboardShell } from "@/components/DashboardShell";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const steps = ["Negócio", "Localização", "Visual", "Contato", "Pix e Wi-Fi", "Serviços", "Confirmar"];

const segments = [
  "Barbearia", "Salão de beleza", "Clínica", "Dentista", "Restaurante",
  "Lanchonete", "Delivery", "Loja", "Pet shop", "Academia",
  "Oficina", "Assistência técnica", "Fotógrafo", "Outro"
];

const themeOptions = [
  { id: "dark-gold", label: "Preto e Dourado", bg: "#050a12", primary: "#D4AF37" },
  { id: "ocean-blue", label: "Azul oceano", bg: "#0f172a", primary: "#38bdf8" },
  { id: "forest-green", label: "Verde floresta", bg: "#052e16", primary: "#4ade80" },
  { id: "rose-pink", label: "Rosa moderno", bg: "#fff1f2", primary: "#f43f5e" },
  { id: "pure-white", label: "Branco clean", bg: "#ffffff", primary: "#31c4a8" },
  { id: "deep-purple", label: "Roxo premium", bg: "#0f0a2e", primary: "#a855f7" },
];

type Form = {
  // Negócio
  businessName: string;
  ownerName: string;
  segment: string;
  description: string;
  // Localização
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  mapsUrl: string;
  // Visual
  themeId: string;
  logoUrl: string;
  // Contato
  whatsapp: string;
  phone: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  email: string;
  website: string;
  // Pix
  pixEnabled: boolean;
  pixKey: string;
  pixName: string;
  // Wifi
  wifiEnabled: boolean;
  wifiSsid: string;
  wifiPassword: string;
  // Serviços
  services: { name: string; price: string; description: string }[];
  // Extras
  googleReviewUrl: string;
  bookingUrl: string;
};

const empty: Form = {
  businessName: "", ownerName: "", segment: "", description: "",
  street: "", number: "", neighborhood: "", city: "", state: "", mapsUrl: "",
  themeId: "dark-gold", logoUrl: "",
  whatsapp: "", phone: "", instagram: "", facebook: "", tiktok: "", email: "", website: "",
  pixEnabled: false, pixKey: "", pixName: "",
  wifiEnabled: false, wifiSsid: "", wifiPassword: "",
  services: [{ name: "", price: "", description: "" }],
  googleReviewUrl: "", bookingUrl: "",
};

const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100";
const label = "block text-sm font-black text-slate-800 mb-1";
const hint = "mt-1 text-xs text-slate-400";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ slug: string; editKey: string } | null>(null);
  const [error, setError] = useState("");

  function set(partial: Partial<Form>) { setForm(f => ({ ...f, ...partial })); }

  function addService() { set({ services: [...form.services, { name: "", price: "", description: "" }] }); }
  function updateService(i: number, partial: Partial<Form["services"][0]>) {
    const s = [...form.services];
    s[i] = { ...s[i], ...partial };
    set({ services: s });
  }
  function removeService(i: number) { set({ services: form.services.filter((_, idx) => idx !== i) }); }

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Faça login primeiro."); setSaving(false); return; }

      const location = [form.street, form.number, form.neighborhood, form.city, form.state].filter(Boolean).join(", ");
      const slug = generateSlug(form.businessName);
      const editKey = generateEditKey();
      const theme = themeOptions.find(t => t.id === form.themeId) ?? themeOptions[0];

      const site: ToqySite = {
        id: generateId("site"),
        slug,
        status: "active" as const,
        editKey,
        ownerPlan: "community",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        segment: (form.segment.toLowerCase().replace(/\s/g, "_") || "outro") as ToqySite["segment"],
        profile: {
          name: form.businessName,
          title: form.segment,
          description: form.description,
          location,
          logoUrl: form.logoUrl,
          logoShape: "circle" as const,
          logoSize: "medium" as const,
          backgroundImageUrl: "",
        },
        contact: {
          whatsapp: form.whatsapp.replace(/\D/g, ""),
          whatsappMessage: "",
          phone: form.phone,
          instagram: form.instagram,
          facebook: form.facebook,
          email: form.email,
          website: form.website,
        },
        links: {
          googleMapsUrl: form.mapsUrl,
          googleReviewUrl: form.googleReviewUrl,
          bookingUrl: form.bookingUrl,
        },
        pix: {
          enabled: form.pixEnabled,
          key: form.pixKey,
          receiver: form.pixName,
          quickAmounts: [],
          allowCustomAmount: true,
          whatsappProofNumber: form.whatsapp.replace(/\D/g, ""),
        },
        wifi: {
          enabled: form.wifiEnabled,
          ssid: form.wifiSsid,
          password: form.wifiPassword,
          encryption: "WPA" as const,
        },
        theme: {
          mode: (theme.bg === "#ffffff" ? "light" : "dark") as "light" | "dark",
          background: theme.bg,
          gradientFrom: theme.bg,
          gradientTo: theme.bg,
          primary: theme.primary,
          secondary: theme.primary,
          accent: theme.primary,
          text: theme.bg === "#ffffff" ? "#0f172a" : "#ffffff",
          muted: theme.bg === "#ffffff" ? "#64748b" : "#cbd5e1",
          card: theme.bg === "#ffffff" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)",
          backgroundType: "solid" as const,
          buttonRadius: "pill" as const,
          buttonFill: "glass" as const,
          buttonStyle: "full" as const,
          useBackgroundOverlay: false,
        },
        buttons: [
          form.whatsapp && { id: generateId("btn"), type: "whatsapp" as const, label: "WhatsApp", url: `https://wa.me/${form.whatsapp.replace(/\D/g, "")}`, enabled: true },
          form.bookingUrl && { id: generateId("btn"), type: "booking" as const, label: "Agendar horário", url: form.bookingUrl, enabled: true },
          form.googleReviewUrl && { id: generateId("btn"), type: "review" as const, label: "Avalie no Google", url: form.googleReviewUrl, enabled: true },
          form.instagram && { id: generateId("btn"), type: "instagram" as const, label: "Instagram", url: form.instagram, enabled: true },
          form.mapsUrl && { id: generateId("btn"), type: "maps" as const, label: "Como chegar", url: form.mapsUrl, enabled: true },
          form.pixEnabled && { id: generateId("btn"), type: "pix" as const, label: "Pix", url: "", enabled: true },
          form.wifiEnabled && { id: generateId("btn"), type: "wifi" as const, label: "Wi-Fi", url: "", enabled: true },
          form.services.filter(s => s.name).length > 0 && { id: generateId("btn"), type: "catalog" as const, label: "Serviços", url: "", enabled: true },
        ].filter(Boolean) as typeof site.buttons,
        modules: {
          saveContact: true,
          whatsapp: !!form.whatsapp,
          instagram: !!form.instagram,
          phone: !!form.phone,
          maps: !!form.mapsUrl,
          wifi: form.wifiEnabled,
          pix: form.pixEnabled,
          pixHub: false,
          googleReview: !!form.googleReviewUrl,
          booking: !!form.bookingUrl,
          catalog: form.services.filter(s => s.name).length > 0,
        },
        catalog: form.services.filter(s => s.name).map(s => ({
          id: generateId("prd"),
          name: s.name,
          description: s.description,
          price: s.price ? `R$ ${s.price}` : "",
          imageUrl: "",
          imageLayout: "square" as const,
          category: "Serviços",
          enabled: true,
          actionLabel: "Agendar",
          actionUrl: form.bookingUrl || "",
        })),
        catalogLayout: "stack" as const,
        catalogLayouts: ["stack" as const],
        catalogTitle: "Nossos Serviços",
        catalogSubtitle: "",
        promoCard: { enabled: false, title: "", description: "", buttonLabel: "" },
      };

      const result = await syncBiositeToSupabase(site);
      if (!result.ok) throw new Error(result.error ?? "Erro ao salvar");

      setDone({ slug, editKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar bio site");
    } finally {
      setSaving(false);
    }
  }

  if (done) return (
    <DashboardShell>
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-[#31c4a8]">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-black">Bio site criado!</h1>
        <p className="mt-2 text-slate-500">Entregue as informações abaixo para o cliente.</p>
        <div className="mt-8 space-y-4 text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Link do bio site</p>
            <p className="mt-1 break-all font-mono font-black text-slate-900">toqy.com.br/b/{done.slug}</p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-400">Acesso para editar</p>
            <p className="mt-2 text-sm font-bold text-indigo-900">1. Acesse: <strong>toqy.com.br/me</strong></p>
            <p className="text-sm font-bold text-indigo-900">2. Slug: <strong>{done.slug}</strong></p>
            <p className="text-sm font-bold text-indigo-900">3. Chave: <strong className="font-mono text-lg text-indigo-700">{done.editKey}</strong></p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <a href={`/b/${done.slug}`} target="_blank" className="block rounded-2xl bg-[#31c4a8] px-5 py-4 font-black text-white">Ver bio site</a>
          <a href={`/editar/${done.slug}?key=${done.editKey}`} target="_blank" className="block rounded-2xl border border-slate-200 px-5 py-4 font-black text-slate-700">Abrir editor</a>
          <button onClick={() => { setForm(empty); setStep(0); setDone(null); }} className="block rounded-2xl border border-slate-200 px-5 py-4 font-black text-slate-500">Criar outro bio site</button>
        </div>
      </div>
    </DashboardShell>
  );

  const stepContent = () => {
    if (step === 0) return (
      <div className="grid gap-4">
        <div>
          <label className={label}>Nome do negócio <span className="text-red-500">*</span></label>
          <input className={field} value={form.businessName} onChange={e => set({ businessName: e.target.value })} placeholder="Ex: Barbearia do João" />
        </div>
        <div>
          <label className={label}>Nome do responsável</label>
          <input className={field} value={form.ownerName} onChange={e => set({ ownerName: e.target.value })} placeholder="Ex: João Silva" />
        </div>
        <div>
          <label className={label}>Segmento <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {segments.map(s => (
              <button key={s} type="button" onClick={() => set({ segment: s })}
                className={"rounded-2xl border px-3 py-2.5 text-sm font-black transition " + (form.segment === s ? "border-[#31c4a8] bg-emerald-50 text-[#1f9f87]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label}>Descrição breve do negócio</label>
          <textarea className={field} rows={3} value={form.description} onChange={e => set({ description: e.target.value })} placeholder="Ex: Barbearia masculina especializada em cortes modernos e degradê." />
        </div>
        <div>
          <label className={label}>Link do Google Meu Negócio (avaliações)</label>
          <input className={field} value={form.googleReviewUrl} onChange={e => set({ googleReviewUrl: e.target.value })} placeholder="https://g.page/r/..." />
          <p className={hint}>Deixe vazio se não tiver</p>
        </div>
        <div>
          <label className={label}>Link de agendamento (Booksy, Trinks, etc.)</label>
          <input className={field} value={form.bookingUrl} onChange={e => set({ bookingUrl: e.target.value })} placeholder="https://booksy.com/..." />
        </div>
      </div>
    );

    if (step === 1) return (
      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={label}>Rua</label>
            <input className={field} value={form.street} onChange={e => set({ street: e.target.value })} placeholder="Rua das Flores" />
          </div>
          <div>
            <label className={label}>Número</label>
            <input className={field} value={form.number} onChange={e => set({ number: e.target.value })} placeholder="123" />
          </div>
        </div>
        <div>
          <label className={label}>Bairro</label>
          <input className={field} value={form.neighborhood} onChange={e => set({ neighborhood: e.target.value })} placeholder="Centro" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={label}>Cidade</label>
            <input className={field} value={form.city} onChange={e => set({ city: e.target.value })} placeholder="Indaiatuba" />
          </div>
          <div>
            <label className={label}>Estado</label>
            <input className={field} value={form.state} onChange={e => set({ state: e.target.value })} placeholder="SP" maxLength={2} />
          </div>
        </div>
        <div>
          <label className={label}>Link do Google Maps</label>
          <input className={field} value={form.mapsUrl} onChange={e => set({ mapsUrl: e.target.value })} placeholder="https://maps.google.com/..." />
          <p className={hint}>Abra o local no Google Maps e copie o link de compartilhamento</p>
        </div>
      </div>
    );

    if (step === 2) return (
      <div className="grid gap-4">
        <div>
          <label className={label}>Cor do tema</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {themeOptions.map(t => (
              <button key={t.id} type="button" onClick={() => set({ themeId: t.id })}
                className={"relative rounded-2xl border-2 p-3 transition " + (form.themeId === t.id ? "border-[#31c4a8]" : "border-transparent")}>
                <div className="h-10 rounded-xl" style={{ background: t.bg, border: `2px solid ${t.primary}` }} />
                <p className="mt-2 text-xs font-black text-slate-700">{t.label}</p>
                {form.themeId === t.id && <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#31c4a8]"><Check className="h-3 w-3 text-white" /></div>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label}>URL da logo (link direto para imagem)</label>
          <input className={field} value={form.logoUrl} onChange={e => set({ logoUrl: e.target.value })} placeholder="https://... ou deixe em branco para adicionar depois no editor" />
          <p className={hint}>Prefira PNG com fundo transparente. Pode deixar em branco e adicionar depois no editor.</p>
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="grid gap-4">
        <div>
          <label className={label}>WhatsApp <span className="text-red-500">*</span></label>
          <input className={field} value={form.whatsapp} onChange={e => set({ whatsapp: e.target.value })} placeholder="5519999999999" />
          <p className={hint}>Apenas números com DDI+DDD — ex: 5519999999999</p>
        </div>
        <div>
          <label className={label}>Telefone fixo / celular adicional</label>
          <input className={field} value={form.phone} onChange={e => set({ phone: e.target.value })} placeholder="+5519999999999" />
        </div>
        <div>
          <label className={label}>Instagram</label>
          <input className={field} value={form.instagram} onChange={e => set({ instagram: e.target.value })} placeholder="https://instagram.com/seuperfil" />
          <p className={hint}>Cole o link completo do perfil</p>
        </div>
        <div>
          <label className={label}>Facebook</label>
          <input className={field} value={form.facebook} onChange={e => set({ facebook: e.target.value })} placeholder="https://facebook.com/suapagina" />
        </div>
        <div>
          <label className={label}>TikTok</label>
          <input className={field} value={form.tiktok} onChange={e => set({ tiktok: e.target.value })} placeholder="https://tiktok.com/@seuperfil" />
        </div>
        <div>
          <label className={label}>E-mail</label>
          <input className={field} type="email" value={form.email} onChange={e => set({ email: e.target.value })} placeholder="contato@seunegocio.com.br" />
        </div>
        <div>
          <label className={label}>Site</label>
          <input className={field} value={form.website} onChange={e => set({ website: e.target.value })} placeholder="https://www.seunegocio.com.br" />
        </div>
      </div>
    );

    if (step === 4) return (
      <div className="space-y-5">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-emerald-950">Pix</h3>
            <div onClick={() => set({ pixEnabled: !form.pixEnabled })} className={"relative w-10 h-6 rounded-full cursor-pointer transition-colors " + (form.pixEnabled ? "bg-[#31c4a8]" : "bg-slate-300")}>
              <div className={"absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform " + (form.pixEnabled ? "translate-x-5" : "translate-x-1")} />
            </div>
          </div>
          {form.pixEnabled && (
            <div className="mt-4 grid gap-3">
              <div>
                <label className={label}>Chave Pix</label>
                <input className={field} value={form.pixKey} onChange={e => set({ pixKey: e.target.value })} placeholder="CPF, CNPJ, email ou chave aleatória" />
              </div>
              <div>
                <label className={label}>Nome do recebedor</label>
                <input className={field} value={form.pixName} onChange={e => set({ pixName: e.target.value })} placeholder="Nome que aparece no Pix" />
              </div>
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-emerald-950">Wi-Fi</h3>
            <div onClick={() => set({ wifiEnabled: !form.wifiEnabled })} className={"relative w-10 h-6 rounded-full cursor-pointer transition-colors " + (form.wifiEnabled ? "bg-[#31c4a8]" : "bg-slate-300")}>
              <div className={"absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform " + (form.wifiEnabled ? "translate-x-5" : "translate-x-1")} />
            </div>
          </div>
          {form.wifiEnabled && (
            <div className="mt-4 grid gap-3">
              <div>
                <label className={label}>Nome da rede (SSID)</label>
                <input className={field} value={form.wifiSsid} onChange={e => set({ wifiSsid: e.target.value })} placeholder="MinhaRede5G" />
              </div>
              <div>
                <label className={label}>Senha</label>
                <input className={field} value={form.wifiPassword} onChange={e => set({ wifiPassword: e.target.value })} placeholder="Senha do Wi-Fi" />
              </div>
            </div>
          )}
        </div>
      </div>
    );

    if (step === 5) return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Adicione os principais serviços ou produtos. Pode deixar em branco e adicionar depois no editor.</p>
        {form.services.map((s, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-700">Serviço {i + 1}</span>
              {form.services.length > 1 && <button type="button" onClick={() => removeService(i)} className="text-xs font-black text-red-500">Remover</button>}
            </div>
            <input className={field} value={s.name} onChange={e => updateService(i, { name: e.target.value })} placeholder="Nome do serviço (ex: Corte social)" />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-0">
                <span className="flex h-[42px] items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm font-black text-slate-500">R$</span>
                <input className="h-[42px] flex-1 rounded-r-xl border border-slate-200 bg-white px-3 text-sm font-black outline-none focus:border-[#31c4a8]" value={s.price} onChange={e => updateService(i, { price: e.target.value })} placeholder="80,00" />
              </div>
              <input className={field} value={s.description} onChange={e => updateService(i, { description: e.target.value })} placeholder="Descrição (opcional)" />
            </div>
          </div>
        ))}
        <button type="button" onClick={addService} className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-black text-slate-500 hover:border-[#31c4a8] hover:text-[#1f9f87]">
          + Adicionar serviço
        </button>
      </div>
    );

    // step 6 — Confirmar
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
          <p className="font-black text-slate-900">{form.businessName || "—"}</p>
          <p className="text-sm text-slate-500">{form.segment} · {[form.city, form.state].filter(Boolean).join(", ")}</p>
          <p className="text-sm text-slate-500">{form.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="font-black text-slate-500">WhatsApp</span><p className="mt-1 font-black text-slate-900">{form.whatsapp || "—"}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="font-black text-slate-500">Instagram</span><p className="mt-1 font-black text-slate-900 truncate">{form.instagram || "—"}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="font-black text-slate-500">Pix</span><p className="mt-1 font-black text-slate-900">{form.pixEnabled ? form.pixKey || "Configurado" : "Não"}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="font-black text-slate-500">Wi-Fi</span><p className="mt-1 font-black text-slate-900">{form.wifiEnabled ? form.wifiSsid || "Configurado" : "Não"}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="font-black text-slate-500">Serviços</span><p className="mt-1 font-black text-slate-900">{form.services.filter(s => s.name).length} cadastrados</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3"><span className="font-black text-slate-500">Tema</span><p className="mt-1 font-black text-slate-900">{themeOptions.find(t => t.id === form.themeId)?.label}</p></div>
        </div>
        {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
      </div>
    );
  };

  const canNext = () => {
    if (step === 0) return !!form.businessName && !!form.segment;
    return true;
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-950">Criar bio site para cliente</h1>
          <p className="mt-1 text-sm text-slate-500">Preencha com as informações do cliente. Você pode editar qualquer detalhe depois.</p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-black " + (i < step ? "bg-[#31c4a8] text-white" : i === step ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500")}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={"text-xs font-black " + (i === step ? "text-slate-900" : "text-slate-400")}>{s}</span>
              {i < steps.length - 1 && <div className="h-px w-4 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-black text-slate-900">{steps[step]}</h2>
          {stepContent()}
        </div>

        {/* Navigation */}
        <div className="mt-5 flex justify-between">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          {step < steps.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-40">
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#31c4a8] px-6 py-3 text-sm font-black text-white disabled:opacity-60">
              {saving ? "Criando..." : "Criar bio site"} <Check className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
