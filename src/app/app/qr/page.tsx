"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, ExternalLink, QrCode, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { createPublicUrl } from "@/lib/dataProvider";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import type { ToqySite } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

export default function QRPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [copied, setCopied] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const allSites = await listBiositesFromSupabase();
      setSites(allSites);
      setSelectedSlug(new URLSearchParams(window.location.search).get("site") || allSites[0]?.slug || "");
    });
  }, []);

  const selectedSite = useMemo(() => sites.find((site) => site.slug === selectedSlug) ?? sites[0], [selectedSlug, sites]);
  const publicUrl = selectedSite && typeof window !== "undefined" ? `${window.location.origin}${createPublicUrl(selectedSite.slug)}` : "";

  async function copy(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied("link");
    setTimeout(() => setCopied(""), 1500);
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !selectedSite) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `toqy-qr-${selectedSite.slug}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">QR + NFC</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">QR Codes</h1>
          <p className="mt-2 max-w-2xl text-muted">Gere e copie os QR Codes dos seus bio sites.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-sm font-black text-accent-dim">
          <QrCode className="h-4 w-4" /> Plaquinha física
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
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
                <Copy className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}
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
        </section>

        <aside className="rounded-[2rem] border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Smartphone className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-ink">{selectedSite?.profile.name ?? "Bio site"}</h2>
          <p className="mt-1 text-sm text-muted">Prévia da plaquinha</p>
          <div ref={qrRef} className="mx-auto mt-6 w-fit rounded-[2rem] border border-border bg-card p-5 shadow-xl">
            {publicUrl ? <QRCodeSVG value={publicUrl} size={220} /> : null}
          </div>
          <div className="mx-auto mt-6 max-w-[260px] rounded-[1.6rem] bg-ink p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Aproxime ou escaneie</p>
            <p className="mt-3 text-lg font-black">{selectedSite?.profile.name ?? "TOQY"}</p>
            <p className="mt-2 text-xs text-white/60">Links, Pix, Wi-Fi e atendimento em um só lugar.</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
