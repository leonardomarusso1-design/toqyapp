"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, QrCode, Smartphone } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import type { ToqySite } from "@/lib/types";
import { createPublicUrl, mergeMockAndStoredSites } from "@/lib/siteStorage";

export default function QRPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const allSites = mergeMockAndStoredSites();
    setSites(allSites);
    setSelectedSlug(new URLSearchParams(window.location.search).get("site") || allSites[0]?.slug || "");
  }, []);

  const selectedSite = useMemo(() => sites.find((site) => site.slug === selectedSlug) ?? sites[0], [selectedSlug, sites]);
  const publicUrl = selectedSite && typeof window !== "undefined" ? `${window.location.origin}${createPublicUrl(selectedSite.slug)}` : "";

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied("link");
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">QR Codes</h1>
          <p className="mt-1 max-w-2xl text-slate-500">Use este QR Code na plaquinha fisica ou grave este link no chip NFC.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#1f9f87]">
          <QrCode className="h-4 w-4" /> QR + NFC
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="text-sm font-black text-slate-800">Selecionar biosite</span>
            <select value={selectedSite?.slug ?? ""} onChange={(event) => setSelectedSlug(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100">
              {sites.map((site) => <option key={site.id} value={site.slug}>{site.profile.name} · /b/{site.slug}</option>)}
            </select>
          </label>

          <div className="mt-6 rounded-[2rem] border border-slate-100 bg-[#f8fbfa] p-5">
            <p className="text-sm font-black text-slate-500">Link publico</p>
            <p className="mt-2 break-all text-lg font-black text-slate-950">{publicUrl || "Selecione um biosite"}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => copy(publicUrl)} disabled={!publicUrl} className="inline-flex items-center gap-2 rounded-2xl bg-[#31c4a8] px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                <Copy className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600">
                <Download className="h-4 w-4" /> Baixar QR
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#31c4a8]">
            <Smartphone className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-black">{selectedSite?.profile.name ?? "Biosite"}</h2>
          <p className="mt-1 text-sm text-slate-500">Previa da plaquinha</p>
          <div className="mx-auto mt-6 w-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
            {publicUrl ? <QRCodeSVG value={publicUrl} size={220} /> : null}
          </div>
          <div className="mx-auto mt-6 max-w-[260px] rounded-[1.6rem] bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8df5df]">Aproxime ou escaneie</p>
            <p className="mt-3 text-lg font-black">{selectedSite?.profile.name ?? "TOQY"}</p>
            <p className="mt-2 text-xs text-slate-300">Links, Pix, Wi-Fi e atendimento em um so lugar.</p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
