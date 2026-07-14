"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, ImagePlus, Loader2, Lock, Sparkles, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { resolvePlanTier } from "@/lib/subscriptions";
import { PLAN_AI_ART_CREDITS, UNLIMITED_AI_ART_EMAILS } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";
import type { PlaqueSize, PlaqueType } from "@/lib/plaqueGenerator";

const PLAQUE_TYPES: { value: PlaqueType; label: string }[] = [
  { value: "biosite", label: "Bio site (perfil digital)" },
  { value: "pix", label: "Pagamento via Pix" },
  { value: "wifi", label: "Acesso ao Wi-Fi" },
  { value: "google_review", label: "Avaliação no Google" },
];

const SIZES: { value: PlaqueSize; label: string }[] = [
  { value: "10x15", label: "10x15 cm (padrão)" },
  { value: "5x10", label: "5x10 cm (compacta)" },
  { value: "custom", label: "Tamanho personalizado" },
];

export default function ArtesPage() {
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);

  const [plaqueType, setPlaqueType] = useState<PlaqueType>("biosite");
  const [size, setSize] = useState<PlaqueSize>("10x15");
  const [customWidth, setCustomWidth] = useState("10");
  const [customHeight, setCustomHeight] = useState("15");
  const [businessName, setBusinessName] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [pixReceiverName, setPixReceiverName] = useState("");
  const [pixKeyText, setPixKeyText] = useState("");
  const [wifiNetworkName, setWifiNetworkName] = useState("");
  const [wifiPasswordText, setWifiPasswordText] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setAccessToken(session.access_token);
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan_toqy, plan_tier, ai_art_credits_used")
        .eq("id", session.user.id)
        .maybeSingle();
      setPlanTier(profile?.plan_toqy || profile?.plan_tier || "free");
      setCreditsUsed(profile?.ai_art_credits_used ?? 0);
      setUnlimited(Boolean(session.user.email && UNLIMITED_AI_ART_EMAILS.includes(session.user.email.toLowerCase())));
    });
  }, []);

  const creditsLimit = unlimited ? Infinity : PLAN_AI_ART_CREDITS[resolvePlanTier(planTier)];
  const hasCredits = unlimited || creditsUsed < creditsLimit;

  function handleLogoFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Selecione um arquivo de imagem pra logo."); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!accessToken) { setError("Sessão expirada — atualize a página e entre novamente."); return; }
    if (!businessName.trim()) { setError("Preencha o nome do negócio."); return; }
    setError("");
    setGenerating(true);
    setResultUrl(null);
    try {
      const res = await fetch("/api/plaque-designs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          plaqueType,
          size,
          customWidthCm: size === "custom" ? Number(customWidth) : undefined,
          customHeightCm: size === "custom" ? Number(customHeight) : undefined,
          businessName: businessName.trim(),
          extraInfo: extraInfo.trim() || undefined,
          logoDataUrl: logoDataUrl || undefined,
          pixReceiverName: plaqueType === "pix" ? pixReceiverName.trim() || undefined : undefined,
          pixKeyText: plaqueType === "pix" ? pixKeyText.trim() || undefined : undefined,
          wifiNetworkName: plaqueType === "wifi" ? wifiNetworkName.trim() || undefined : undefined,
          wifiPasswordText: plaqueType === "wifi" ? wifiPasswordText.trim() || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar a arte");
      setResultUrl(data.design.image_url);
      setCreditsUsed(data.creditsUsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Novo</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">Artes com IA</h1>
          <p className="mt-2 max-w-2xl text-muted">Sobe a logo, preenche as informações e a IA cria a arte pronta pra sua plaquinha física.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm font-black text-accent-dim">
          <Sparkles className="h-4 w-4" /> {unlimited ? `${creditsUsed}/∞ créditos usados` : `${creditsUsed}/${creditsLimit || 0} créditos usados`}
        </div>
      </div>

      {creditsLimit === 0 ? (
        <div className="mt-7 rounded-[2rem] border border-dashed border-accent/40 bg-accent/5 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-3 text-lg font-black text-ink">Recurso do plano pago</p>
          <p className="mt-1 text-sm text-muted">O gerador de arte com IA está disponível a partir do plano Freelancer.</p>
          <Link href="/#planos" className="mt-4 inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white">Ver planos</Link>
        </div>
      ) : !hasCredits ? (
        <div className="mt-7 rounded-[2rem] border border-dashed border-amber-400/50 bg-amber-50 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-3 text-lg font-black text-ink">Créditos esgotados</p>
          <p className="mt-1 text-sm text-muted">Você já usou os {creditsLimit} créditos de geração incluídos no seu plano. Fale com o suporte pra saber sobre pacotes extras.</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <label className="block">
              <span className="text-sm font-black text-ink">Tipo de plaquinha</span>
              <select value={plaqueType} onChange={(e) => setPlaqueType(e.target.value as PlaqueType)} className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10">
                {PLAQUE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-ink">Tamanho</span>
              <select value={size} onChange={(e) => setSize(e.target.value as PlaqueSize)} className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10">
                {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>

            {size === "custom" ? (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-black text-ink">Largura (cm)</span>
                  <input value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-ink">Altura (cm)</span>
                  <input value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
              </div>
            ) : null}

            <label className="block">
              <span className="text-sm font-black text-ink">Nome do negócio</span>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Barbearia Andrian" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
            </label>

            {plaqueType === "pix" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-ink">Nome do favorecido (opcional)</span>
                  <input value={pixReceiverName} onChange={(e) => setPixReceiverName(e.target.value)} placeholder="Como aparece pro banco" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-ink">Chave Pix (opcional, só texto na arte)</span>
                  <input value={pixKeyText} onChange={(e) => setPixKeyText(e.target.value)} placeholder="CPF, e-mail, telefone..." className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
              </div>
            ) : null}

            {plaqueType === "wifi" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-ink">Nome da rede (opcional)</span>
                  <input value={wifiNetworkName} onChange={(e) => setWifiNetworkName(e.target.value)} placeholder="Ex: Loja_WiFi" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-ink">Senha (opcional, só texto na arte)</span>
                  <input value={wifiPasswordText} onChange={(e) => setWifiPasswordText(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
              </div>
            ) : null}

            <label className="block">
              <span className="text-sm font-black text-ink">Informações extras (opcional)</span>
              <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} rows={3} placeholder="Ex: cores da marca, frase de chamada, estilo desejado" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 resize-none" />
            </label>

            <div>
              <span className="text-sm font-black text-ink">Logo (opcional)</span>
              <div className="mt-2 grid gap-3 md:grid-cols-[96px_1fr] md:items-center">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface text-xs font-bold text-muted">
                  {logoDataUrl ? (
                    <>
                      <img src={logoDataUrl} alt="Logo" className="h-full w-full object-contain" />
                      <button type="button" onClick={() => setLogoDataUrl(null)} aria-label="Remover logo" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : "Preview"}
                </div>
                <div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim">
                    <ImagePlus className="h-4 w-4" /> {logoDataUrl ? "Trocar logo" : "Enviar logo"}
                  </button>
                </div>
              </div>
            </div>

            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !businessName.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-black text-white transition disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Gerando com IA..." : "Gerar arte com IA"}
            </button>
            <p className="text-xs text-muted">Depois de gerada, você poderá ajustar textos e posicionar o QR Code na arte (em breve).</p>
          </section>

          <aside className="rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-black text-ink">Resultado</h2>
            <div className="mx-auto mt-5 flex aspect-[2/3] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[1.6rem] border border-border bg-surface">
              {generating ? (
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
              ) : resultUrl ? (
                <img src={resultUrl} alt="Arte gerada" className="h-full w-full object-cover" />
              ) : (
                <p className="p-4 text-sm text-muted">A prévia aparece aqui depois de gerar</p>
              )}
            </div>
            {resultUrl ? (
              <a href={resultUrl} download target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink">
                <Download className="h-4 w-4" /> Baixar imagem
              </a>
            ) : null}
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
