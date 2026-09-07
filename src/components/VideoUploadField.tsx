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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { resolve(video.duration); URL.revokeObjectURL(video.src); };
    video.onerror = () => reject(new Error("Não foi possível ler o arquivo de vídeo."));
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUploadField({ value, onChange, slug, editKey }: { value?: string; onChange: (url: string) => void; slug?: string; editKey?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
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
      if (file.size > MAX_BYTES) throw new Error(`Arquivo muito grande (máx. ${Math.round(MAX_BYTES / 1024 / 1024)}MB, ~${MAX_SECONDS}s em baixa/média qualidade).`);

      const duration = await getVideoDuration(file).catch(() => 0);
      if (duration > MAX_SECONDS) throw new Error(`Vídeo muito longo (máx. ${MAX_SECONDS}s) — corte um trecho antes de enviar.`);

      setLoading(true);
      const dataUrl = await fileToDataUrl(file);

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
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o vídeo.");
    } finally {
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
              <input ref={inputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {loading ? "Enviando..." : "Enviar vídeo do dispositivo"}
              </button>
              <p className="mt-1 text-xs font-semibold text-muted">MP4 ou WebM — até {MAX_SECONDS}s e {Math.round(MAX_BYTES / 1024 / 1024)}MB. Corte um trecho curto antes de enviar.</p>
            </>
          )}
        </div>
      )}
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
