"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink, Link2, Lock, QrCode, Smartphone, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { createPublicUrl } from "@/lib/dataProvider";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { generatePixBRCode } from "@/lib/pixBrCode";
import { getPlan, resolvePlanTier } from "@/lib/subscriptions";
import type { ToqySite } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

type Mode = "biosite" | "pix" | "link";

type SavedQrCode = {
  id: string;
  seq_number: number;
  slug: string;
  mode: "pix" | "link";
  label: string | null;
  pix_key: string | null;
  pix_receiver_name: string | null;
  pix_city: string | null;
  pix_amount: number | null;
  target_url: string | null;
  created_at: string;
};

export default function QRPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [copied, setCopied] = useState("");
  const [mode, setMode] = useState<Mode>("biosite");
  const [planTier, setPlanTier] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // QR avulso (2026-07-13) — pedido do Leonardo pra gerar QR Code de Pix ou
  // de link qualquer (ex: pra gravar num chip NFC) sem precisar criar um
  // bio site inteiro. Feature paga ("QR personalizado" já era promessa dos
  // planos pagos) — free continua só com o QR do próprio bio site.
  const [pixKey, setPixKey] = useState("");
  const [pixName, setPixName] = useState("");
  const [pixCity, setPixCity] = useState("");
  const [pixAmount, setPixAmount] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Link público pra NFC (2026-07-14) — o QR gerado nesta tela era só uma
  // prévia efêmera na tela, sem link nenhum. NFC grava um LINK, não uma
  // imagem — então salva o Pix/link num registro com slug público e devolve
  // essa URL, que é o que de fato vai gravado dentro do chip da tag.
  const [accessToken, setAccessToken] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [savedSeq, setSavedSeq] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Lista dos QR Codes já salvos + edição no lugar (2026-07-15, pedido do
  // Leonardo: "criei o pix e gerou o link, mas não ficou salvo em lugar
  // nenhum... nem consigo editar sem precisar mudar o QR que já tá na
  // plaquinha"). editingId != null = estamos editando um QR existente: o
  // botão salva com PATCH (mesmo slug, mesmo QR físico) em vez de criar um
  // novo registro.
  const [savedList, setSavedList] = useState<SavedQrCode[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchSavedList(token: string) {
    setLoadingList(true);
    try {
      const res = await fetch("/api/qr-codes", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) setSavedList(json.qrCodes || []);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setAccessToken(session.access_token);
      const [allSites, { data: profile }] = await Promise.all([
        listBiositesFromSupabase(),
        supabase.from("profiles").select("plan_toqy, plan_tier").eq("id", session.user.id).maybeSingle(),
      ]);
      setSites(allSites);
      setSelectedSlug(new URLSearchParams(window.location.search).get("site") || allSites[0]?.slug || "");
      setPlanTier(profile?.plan_toqy || profile?.plan_tier || "free");
      fetchSavedList(session.access_token);
    });
  }, []);

  // Reseta o link salvo sempre que os dados do Pix/link mudam — o link
  // salvo anteriormente não reflete mais o que está preenchido na tela.
  // Não reseta ao ENTRAR em modo de edição (o efeito abaixo já popula
  // savedUrl/savedSeq direto do registro sendo editado).
  useEffect(() => {
    if (editingId) return;
    setSavedUrl("");
    setSavedSeq(null);
    setSaveError("");
  }, [mode, pixKey, pixName, pixCity, pixAmount, linkUrl, editingId]);

  function startEdit(row: SavedQrCode) {
    setEditingId(row.id);
    setMode(row.mode);
    if (row.mode === "pix") {
      setPixKey(row.pix_key || "");
      setPixName(row.pix_receiver_name || "");
      setPixCity(row.pix_city || "");
      setPixAmount(row.pix_amount ? String(row.pix_amount) : "");
    } else {
      setLinkUrl(row.target_url || "");
    }
    setSavedUrl(`${window.location.origin}/qr/${row.slug}`);
    setSavedSeq(row.seq_number);
    setSaveError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setPixKey("");
    setPixName("");
    setPixCity("");
    setPixAmount("");
    setLinkUrl("");
    setSavedUrl("");
    setSavedSeq(null);
  }

  async function saveAndGetLink() {
    if (mode === "biosite") return;
    setSaving(true);
    setSaveError("");
    try {
      const url = editingId ? `/api/qr-codes/${editingId}` : "/api/qr-codes";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(
          mode === "pix"
            ? { mode: "pix", pixKey, pixReceiverName: pixName, pixCity, pixAmount: pixAmount ? Number(pixAmount.replace(",", ".")) : undefined }
            : { mode: "link", label: previewLabel, targetUrl: ensureHttp(linkUrl) }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao salvar");
      setSavedUrl(`${window.location.origin}/qr/${json.qrCode.slug}`);
      setSavedSeq(json.qrCode.seq_number);
      fetchSavedList(accessToken);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // Excluir QR salvo (2026-07-15, pedido do Leonardo: "quando criar algo
  // editável, também poder excluir" — regra geral pra toda a plataforma,
  // não só aqui).
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteQrCode(id: string) {
    if (!window.confirm("Excluir este QR Code salvo? O link público para de funcionar.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/qr-codes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao excluir");
      if (editingId === id) cancelEdit();
      fetchSavedList(accessToken);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  const plan = getPlan(resolvePlanTier(planTier));
  const selectedSite = useMemo(() => sites.find((site) => site.slug === selectedSlug) ?? sites[0], [selectedSlug, sites]);
  const publicUrl = selectedSite && typeof window !== "undefined" ? `${window.location.origin}${createPublicUrl(selectedSite.slug)}` : "";

  const pixValue = useMemo(() => {
    if (mode !== "pix" || !pixKey.trim() || !pixName.trim()) return "";
    const amount = pixAmount ? Number(pixAmount.replace(",", ".")) : undefined;
    return generatePixBRCode({ key: pixKey.trim(), merchantName: pixName.trim(), city: pixCity.trim() || "BRASIL", amount });
  }, [mode, pixKey, pixName, pixCity, pixAmount]);

  // O QR Code IMPRESSO precisa ser sempre o LINK público estável
  // (/qr/{slug}), nunca o dado bruto do Pix/link (2026-07-15, achado real
  // do Leonardo: "quando mudo alguma informação no editar, o QR code
  // muda... a plaquinha é a mesma, só muda a informação dentro do qr
  // code"). QR Code é uma codificação direta do texto — qualquer edição no
  // Pix/link muda literalmente o desenho do QR. Por isso, pra pix/link,
  // só existe QR "definitivo" DEPOIS de salvo (savedUrl) — antes disso é
  // só uma prévia, e o botão de baixar fica bloqueado, pra nunca imprimir
  // um QR que vai virar obsoleto na primeira edição.
  const qrIsFinal = mode === "biosite" || Boolean(savedUrl);
  const qrValue = mode === "biosite" ? publicUrl : mode === "pix" ? savedUrl || pixValue : savedUrl || ensureHttp(linkUrl);
  const previewLabel = mode === "biosite" ? (selectedSite?.profile.name ?? "Bio site") : mode === "pix" ? (pixName || "Pix") : "Link";

  async function copy(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(mode);
    setTimeout(() => setCopied(""), 1500);
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !qrValue || !qrIsFinal) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `toqy-qr-${mode}-${Date.now()}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">QR + NFC</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">QR Codes</h1>
          <p className="mt-2 max-w-2xl text-muted">Gere QR Codes de bio site, Pix ou de qualquer link — inclusive pra gravar num chip NFC.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm font-black text-accent-dim">
          <QrCode className="h-4 w-4" /> Plaquinha física
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {([
          { key: "biosite" as Mode, label: "Bio site" },
          { key: "pix" as Mode, label: "Pix" },
          { key: "link" as Mode, label: "Link personalizado" },
        ]).map((tab) => {
          const locked = tab.key !== "biosite" && !plan.hasCustomQr;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => !locked && setMode(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                mode === tab.key ? "bg-accent text-white" : "border border-border bg-card text-ink hover:border-accent"
              } ${locked ? "opacity-60" : ""}`}
            >
              {locked ? <Lock className="h-3.5 w-3.5" /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          {mode !== "biosite" && !plan.hasCustomQr ? (
            <div className="rounded-[1.6rem] border border-dashed border-accent/40 bg-accent/5 p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-3 text-lg font-black text-ink">Recurso do plano pago</p>
              <p className="mt-1 text-sm text-muted">QR Code de Pix e de link personalizado fazem parte do QR Code personalizado, disponível a partir do plano Freelancer.</p>
              <Link href="/#planos" className="mt-4 inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white">Ver planos</Link>
            </div>
          ) : mode === "biosite" ? (
            <>
              <label className="block">
                <span className="text-sm font-black text-ink">Selecionar bio site</span>
                <select value={selectedSite?.slug ?? ""} onChange={(event) => setSelectedSlug(event.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10">
                  {sites.map((site) => <option key={site.id} value={site.slug}>{site.profile.name} · /b/{site.slug}</option>)}
                </select>
              </label>

              <div className="mt-6 rounded-[2rem] border border-border bg-surface p-5">
                <p className="text-sm font-black text-muted">Link público</p>
                <p className="mt-2 break-all text-lg font-black text-ink">{publicUrl || "Selecione um bio site"}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">Use este QR Code na plaquinha física ou grave este link no chip NFC.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => copy(publicUrl)} disabled={!publicUrl} className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                    <Copy className="h-4 w-4" />{copied === "biosite" ? "Copiado" : "Copiar link"}
                  </button>
                  <button type="button" onClick={downloadQr} disabled={!publicUrl} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink disabled:opacity-50">
                    <Download className="h-4 w-4" /> Baixar QR
                  </button>
                  {selectedSite ? (
                    <Link href={createPublicUrl(selectedSite.slug)} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink">
                      Abrir bio site <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </>
          ) : mode === "pix" ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-black text-ink">Chave Pix</span>
                <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
              </label>
              <label className="block">
                <span className="text-sm font-black text-ink">Nome do recebedor</span>
                <input value={pixName} onChange={(e) => setPixName(e.target.value)} placeholder="Como aparece pro banco" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-ink">Cidade (opcional)</span>
                  <input value={pixCity} onChange={(e) => setPixCity(e.target.value)} placeholder="Indaiatuba" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-ink">Valor fixo (opcional)</span>
                  <input value={pixAmount} onChange={(e) => setPixAmount(e.target.value)} placeholder="Deixe em branco pra quem paga digitar" inputMode="decimal" className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </label>
              </div>
              <div className="rounded-[2rem] border border-border bg-surface p-5">
                <p className="text-sm leading-relaxed text-muted">Este QR Code é um Pix de verdade (padrão Banco Central) — escaneável em qualquer app de banco, ou copie o código abaixo pra colar no "Pix Copia e Cola".</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => copy(pixValue)} disabled={!pixValue} className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                    <Copy className="h-4 w-4" />{copied === "pix" ? "Copiado" : "Copiar código Pix"}
                  </button>
                  <button type="button" onClick={downloadQr} disabled={!qrIsFinal} title={qrIsFinal ? undefined : "Gere o link pra NFC primeiro — esse é o QR que fica fixo na plaquinha"} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink disabled:opacity-50">
                    <Download className="h-4 w-4" /> Baixar QR
                  </button>
                </div>
                {!qrIsFinal ? (
                  <p className="mt-3 text-xs font-bold text-accent">Gere o link pra NFC abaixo antes de baixar/imprimir — esse é o QR definitivo, que nunca muda mesmo se você editar os dados do Pix depois.</p>
                ) : null}
              </div>
              <NfcLinkPanel saving={saving} saveError={saveError} savedUrl={savedUrl} savedSeq={savedSeq} onSave={saveAndGetLink} canSave={Boolean(pixValue)} isEditing={Boolean(editingId)} onCancelEdit={cancelEdit} />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-black text-ink">Link</span>
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
              </label>
              <div className="rounded-[2rem] border border-border bg-surface p-5">
                <p className="text-sm leading-relaxed text-muted">Use pra gravar num chip NFC de plaquinha, num cardápio impresso, ou qualquer lugar que precise de um QR Code próprio (não precisa ser um bio site do Toqy).</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => copy(ensureHttp(linkUrl))} disabled={!linkUrl} className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                    <Copy className="h-4 w-4" />{copied === "link" ? "Copiado" : "Copiar link"}
                  </button>
                  <button type="button" onClick={downloadQr} disabled={!qrIsFinal} title={qrIsFinal ? undefined : "Gere o link pra NFC primeiro — esse é o QR que fica fixo na plaquinha"} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-ink disabled:opacity-50">
                    <Download className="h-4 w-4" /> Baixar QR
                  </button>
                </div>
                {!qrIsFinal ? (
                  <p className="mt-3 text-xs font-bold text-accent">Gere o link pra NFC abaixo antes de baixar/imprimir — esse é o QR definitivo, que nunca muda mesmo se você editar o link depois.</p>
                ) : null}
              </div>
              <NfcLinkPanel saving={saving} saveError={saveError} savedUrl={savedUrl} savedSeq={savedSeq} onSave={saveAndGetLink} canSave={Boolean(linkUrl.trim())} isEditing={Boolean(editingId)} onCancelEdit={cancelEdit} />
            </div>
          )}
        </section>

        <aside className="relative rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
          {savedSeq ? (
            <span className="absolute right-5 top-5 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold text-white/80">
              #{String(savedSeq).padStart(3, "0")}
            </span>
          ) : null}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Smartphone className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-ink">{previewLabel}</h2>
          <p className="mt-1 text-sm text-muted">
            {mode === "biosite" ? "Prévia da plaquinha" : qrIsFinal ? "QR definitivo — não muda ao editar" : "Prévia (ainda não salvo)"}
          </p>
          <div ref={qrRef} className="mx-auto mt-6 w-fit rounded-[2rem] border border-border bg-card p-5 shadow-xl">
            {qrValue ? <QRCodeSVG value={qrValue} size={220} /> : <div className="flex h-[220px] w-[220px] items-center justify-center text-sm text-muted">Preencha os dados</div>}
          </div>
          <div className="mx-auto mt-6 max-w-[260px] rounded-[1.6rem] bg-ink p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Aproxime ou escaneie</p>
            <p className="mt-3 text-lg font-black">{previewLabel}</p>
            <p className="mt-2 text-xs text-white/60">Links, Pix, Wi-Fi e atendimento em um só lugar.</p>
          </div>
        </aside>
      </div>

      <div className="mt-10 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink">Meus QR Codes salvos ({savedList.length})</h2>
        <p className="mt-1 text-sm text-muted">Pix e links personalizados que já viraram link público — clique em Editar pra mudar o conteúdo sem trocar o QR já impresso.</p>
        {loadingList ? (
          <p className="mt-4 text-sm text-muted">Carregando...</p>
        ) : savedList.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum QR Code salvo ainda — gere um link acima e ele aparece aqui.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {savedList.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-black text-ink">
                    #{String(row.seq_number).padStart(3, "0")} · {row.mode === "pix" ? row.pix_receiver_name : row.label || "Link"}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-muted">{`${typeof window !== "undefined" ? window.location.origin : ""}/qr/${row.slug}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-black text-ink hover:border-accent"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteQrCode(row.id)}
                    disabled={deletingId === row.id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm font-black text-red-500 hover:border-red-400 disabled:opacity-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function ensureHttp(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Painel "gerar link pra NFC" (2026-07-14) — o QR/Pix desta tela, sozinho,
// não serve pra gravar num chip NFC (NFC grava link, não imagem nem texto
// solto). Este botão salva os dados e devolve um link público fixo
// (/qr/{slug}) que abre uma página mostrando o QR + copia-e-cola — é essa
// URL que vai dentro da tag.
function NfcLinkPanel({
  saving,
  saveError,
  savedUrl,
  savedSeq,
  onSave,
  canSave,
  isEditing,
  onCancelEdit,
}: {
  saving: boolean;
  saveError: string;
  savedUrl: string;
  savedSeq: number | null;
  onSave: () => void;
  canSave: boolean;
  isEditing: boolean;
  onCancelEdit: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!savedUrl) return;
    await navigator.clipboard.writeText(savedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Em modo de edição, o link já existe (mesmo slug, mesmo QR impresso na
  // plaquinha) — sempre mostra o botão de salvar, nunca troca o link.
  const showSaveButton = isEditing || !savedUrl;

  return (
    <div className="rounded-[2rem] border border-dashed border-accent/40 bg-accent/5 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-ink">
          <Link2 className="h-4 w-4 text-accent" /> {isEditing ? "Editando QR salvo" : "Link pra gravar no NFC"}
        </p>
        {isEditing ? (
          <button type="button" onClick={onCancelEdit} className="text-xs font-bold text-muted hover:text-ink">
            Cancelar edição
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {isEditing
          ? "Alterando o conteúdo deste QR sem trocar o link já impresso na plaquinha."
          : "A tag NFC grava um link, não uma imagem. Gere um link fixo que abre uma página com este QR Code + copia-e-cola — é esse link que você grava na tag."}
      </p>
      {savedUrl ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="break-all text-sm font-black text-ink">{savedUrl}</p>
          {savedSeq ? <p className="mt-1 text-xs text-muted">Peça nº {String(savedSeq).padStart(3, "0")}</p> : null}
          <button type="button" onClick={copyLink} className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-black text-ink">
            <Copy className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}
          </button>
        </div>
      ) : null}
      {showSaveButton ? (
        <button type="button" onClick={onSave} disabled={saving || !canSave} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-black text-white disabled:opacity-50">
          <Link2 className="h-4 w-4" />{saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Gerar link pra NFC"}
        </button>
      ) : null}
      {saveError ? <p className="mt-3 text-sm font-bold text-red-500">{saveError}</p> : null}
    </div>
  );
}
