"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generatePixBRCode } from "@/lib/pixBrCode";
import { supabase } from "@/lib/supabaseClient";

type QrCodeRow = {
  seq_number: number;
  mode: "pix" | "link";
  label: string | null;
  pix_key: string | null;
  pix_receiver_name: string | null;
  pix_city: string | null;
  pix_amount: number | null;
  target_url: string | null;
};

// Página pública pro QR/Pix avulso gerado em /app/qr (2026-07-14) — é ESTE
// link que vai gravado dentro do chip NFC da plaquinha. NFC grava um link
// (URL), não uma imagem nem um texto de Pix solto — então essa página
// existe pra ter um endereço fixo que, ao abrir (seja por NFC ou por
// escanear o próprio QR impresso), mostra o QR Code de verdade + o código
// "Pix Copia e Cola" pronto pra colar no banco.
export default function StoredQrHub({ slug }: { slug: string }) {
  const [row, setRow] = useState<QrCodeRow | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("toqy_qr_codes")
      .select("seq_number, mode, label, pix_key, pix_receiver_name, pix_city, pix_amount, target_url")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRow(data as QrCodeRow | null);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (row === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </main>
    );
  }

  if (!row) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-center text-white">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">TOQY</p>
          <h1 className="mt-3 text-3xl font-black">Página não encontrada</h1>
        </div>
      </main>
    );
  }

  const pixValue =
    row.mode === "pix" && row.pix_key && row.pix_receiver_name
      ? generatePixBRCode({
          key: row.pix_key,
          merchantName: row.pix_receiver_name,
          city: row.pix_city || "BRASIL",
          amount: row.pix_amount || undefined,
        })
      : "";
  const qrValue = row.mode === "pix" ? pixValue : row.target_url || "";
  const title = row.mode === "pix" ? row.pix_receiver_name || "Pix" : row.label || "Link";

  async function copy() {
    if (!pixValue) return;
    await navigator.clipboard.writeText(pixValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <div className="relative mx-auto w-full max-w-[430px] rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 text-center">
        <span className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/70">
          #{String(row.seq_number).padStart(3, "0")}
        </span>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
          {row.mode === "pix" ? "TOQY Pix" : "TOQY Link"}
        </p>
        <h1 className="mt-3 text-2xl font-black">{title}</h1>
        <div className="mx-auto mt-6 w-fit rounded-3xl bg-white p-4">
          {qrValue ? <QRCodeSVG value={qrValue} size={220} /> : null}
        </div>
        {row.mode === "pix" ? (
          <>
            <p className="mt-4 text-sm text-slate-400">Escaneie com o app do seu banco ou copie o código abaixo no &quot;Pix Copia e Cola&quot;.</p>
            <p className="mt-4 break-all rounded-2xl bg-slate-900 p-3 text-xs text-slate-300">{pixValue}</p>
            <button
              onClick={copy}
              className="mt-4 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950"
            >
              {copied ? "Copiado!" : "Copiar código Pix"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-400">Escaneie o QR Code ou acesse o link abaixo.</p>
            <a
              href={row.target_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block w-full break-all rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950"
            >
              Abrir link
            </a>
          </>
        )}
      </div>
    </main>
  );
}
