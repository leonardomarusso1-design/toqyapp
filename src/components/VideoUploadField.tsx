"use client";

import { useRef, useState } from "react";
import { Link2, Loader2, Video, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Capa em vídeo (2026-09-07, referência Coonexta — vídeo do Leonardo:
// "coloquei um vídeo no banner"). Mesmo padrão de AudioUploadField.tsx
// (converte pra base64 no navegador, sobe pro Supabase Storage via API,
// guarda só a URL pública). Limite real: ver src/lib/videoStorage.ts.
const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_SECONDS = 12;

// Compressão no navegador (2026-09-08, bug real reportado ao vivo: "gravei
// um vídeo no próprio celular meu, de 4 segundos, não consegui colocar
// pq falou que tava pesado"). Causa raiz: ao contrário de imagem (que já
// passa por resize no canvas + reencode no servidor via sharp — ver
// imageStorage.ts), vídeo subia CRU, do jeito que o celular gravou. Um
// celular moderno grava 1080p/4K a dezenas de Mbps — 4 segundos disso
// facilmente passam de 3.5MB, mesmo sendo um clipe bem curto. O teto de
// 3.5MB em si NÃO dá pra subir (é o corpo de requisição real que a Vercel
// aceita, ~4.5MB, menos a inflação de ~33% do base64 — já calibrado no
// limite, subir o número só move a falha pra dentro da própria
// plataforma). A correção de verdade é comprimir ANTES de virar base64:
// reduz resolução e bitrate no próprio navegador (canvas + MediaRecorder,
// sem biblioteca nova) antes de mandar pro servidor. Um clipe de poucos
// segundos vira algumas centenas de KB a ~1MB depois disso — cabe
// folgado no teto que já existe.
const COMPRESS_MAX_DIM = 480; // banner de topo tem ~224px de altura, catálogo é ainda menor — 480px é mais que suficiente
const COMPRESS_BITRATE = 1_200_000; // ~1.2Mbps, qualidade boa pra um clipe curto e decorativo
const COMPRESS_FPS = 24;

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadVideoElement(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Não foi possível ler o arquivo de vídeo."));
    video.src = URL.createObjectURL(file);
  });
}

function getVideoDuration(file: File): Promise<number> {
  return loadVideoElement(file).then((video) => {
    const duration = video.duration;
    URL.revokeObjectURL(video.src);
    return duration;
  });
}

/**
 * Recomprime o vídeo desenhando cada frame num canvas menor e gravando o
 * resultado com MediaRecorder (webm, sem áudio — o vídeo de capa/catálogo
 * é sempre mudo). Suportado em todo navegador moderno (canvas.captureStream
 * + MediaRecorder), sem dependência nova. Se o navegador não suportar (ou
 * a compressão falhar por qualquer motivo), o chamador cai de volta pro
 * arquivo original — MAX_BYTES continua sendo a rede de segurança final.
 */
async function compressVideo(file: File): Promise<Blob> {
  if (typeof MediaRecorder === "undefined" || !document.createElement("canvas").captureStream) {
    throw new Error("Navegador sem suporte à compressão de vídeo.");
  }

  const video = await loadVideoElement(file);
  try {
    const scale = Math.min(1, COMPRESS_MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(2, Math.round(video.videoWidth * scale));
    const height = Math.max(2, Math.round(video.videoHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar o vídeo neste navegador.");

    const stream = (canvas as HTMLCanvasElement).captureStream(COMPRESS_FPS);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: COMPRESS_BITRATE });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      recorder.onerror = () => reject(new Error("Falha ao comprimir o vídeo."));
    });

    let raf = 0;
    const drawFrame = () => {
      ctx.drawImage(video, 0, 0, width, height);
      raf = requestAnimationFrame(drawFrame);
    };

    await new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.play().then(() => {
        recorder.start();
        drawFrame();
      }).catch(reject);
    });

    cancelAnimationFrame(raf);
    recorder.stop();
    return await recorded;
  } finally {
    URL.revokeObjectURL(video.src);
  }
}

async function uploadVideoDataUrl(dataUrl: string, slug?: string, editKey?: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch("/api/upload-video", {
    method: "POST",
    headers,
    body: JSON.stringify({ dataUrl, slug, editKey }),
  });
  const data: { url?: string; error?: string } = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || "Upload falhou");
  return data.url;
}

export function VideoUploadField({ value, onChange, slug, editKey }: { value?: string; onChange: (url: string) => void; slug?: string; editKey?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  // Mesmo toggle de AudioUploadField.tsx — quem já tem o vídeo hospedado
  // em outro lugar (Drive, CDN próprio) só cola o link, sem passar pelo
  // limite de tamanho/duração do upload direto.
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (!file.type.startsWith("video/")) throw new Error("Selecione um arquivo de vídeo (mp4 ou webm).");
      if (file.size > MAX_BYTES * 6) throw new Error("Arquivo original grande demais — grave um trecho mais curto e tente de novo.");

      const duration = await getVideoDuration(file).catch(() => 0);
      if (duration > MAX_SECONDS) throw new Error(`Vídeo muito longo (máx. ${MAX_SECONDS}s) — corte um trecho antes de enviar.`);

      setCompressing(true);
      const compressed = await compressVideo(file).catch(() => null);
      setCompressing(false);
      const toUpload: File | Blob = compressed ?? file;

      if (toUpload.size > MAX_BYTES) {
        throw new Error(`Vídeo muito grande mesmo após compressão (máx. ${Math.round(MAX_BYTES / 1024 / 1024)}MB) — grave um trecho mais curto.`);
      }

      setLoading(true);
      const dataUrl = await fileToDataUrl(toUpload);
      const url = await uploadVideoDataUrl(dataUrl, slug, editKey);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o vídeo.");
    } finally {
      setCompressing(false);
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <video src={value} muted loop autoPlay playsInline className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">{value}</p>
          <button type="button" onClick={() => onChange("")} aria-label="Remover vídeo de capa" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowUrl((v) => !v)} className="mb-1 inline-flex items-center gap-1 text-xs font-black text-muted transition hover:text-accent-dim">
              <Link2 className="h-3.5 w-3.5" /> {showUrl ? "Enviar arquivo" : "Usar link externo"}
            </button>
          </div>
          {showUrl ? (
            <input
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://.../video.mp4"
            />
          ) : (
            <>
              <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading || compressing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim disabled:opacity-60"
              >
                {loading || compressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {compressing ? "Comprimindo vídeo..." : loading ? "Enviando..." : "Enviar vídeo do dispositivo"}
              </button>
              <p className="mt-1 text-xs font-semibold text-muted">MP4, MOV ou WebM — até {MAX_SECONDS}s. Comprimimos automaticamente antes de enviar.</p>
            </>
          )}
        </div>
      )}
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
