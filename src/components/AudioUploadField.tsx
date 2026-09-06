"use client";

import { useRef, useState } from "react";
import { Link2, Loader2, Music, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Upload de música própria (2026-09-06, pedido do Leonardo) — mesmo padrão
// de ImageUploadField.tsx (converte pra base64 no navegador, sobe pro
// Supabase Storage via API, guarda só a URL pública). Limite real: ver
// src/lib/audioStorage.ts (Vercel Functions aceita ~4,5MB por requisição).
const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_SECONDS = 60;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => { resolve(audio.duration); URL.revokeObjectURL(audio.src); };
    audio.onerror = () => reject(new Error("Não foi possível ler o arquivo de áudio."));
    audio.src = URL.createObjectURL(file);
  });
}

export function AudioUploadField({ value, onChange, slug, editKey }: { value?: string; onChange: (url: string) => void; slug?: string; editKey?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Autonomia total (2026-09-06, pedido do Leonardo: "na música deixar pra
  // enviar do dispositivo ou link externo") — mesmo toggle de
  // ImageUploadField.tsx (showUrl), pra quem já tem a música hospedada em
  // outro lugar (Drive, Dropbox, etc.) e só quer colar o link, sem passar
  // pelo limite de tamanho/duração do upload direto.
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (!file.type.startsWith("audio/")) throw new Error("Selecione um arquivo de áudio (mp3, ogg ou wav).");
      if (file.size > MAX_BYTES) throw new Error(`Arquivo muito grande (máx. ${Math.round(MAX_BYTES / 1024 / 1024)}MB, ~${MAX_SECONDS}s em boa qualidade).`);

      const duration = await getAudioDuration(file).catch(() => 0);
      if (duration > MAX_SECONDS) throw new Error(`Áudio muito longo (máx. ${MAX_SECONDS}s) — corte um trecho antes de enviar.`);

      setLoading(true);
      const dataUrl = await fileToDataUrl(file);

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch("/api/upload-audio", {
        method: "POST",
        headers,
        body: JSON.stringify({ dataUrl, slug, editKey }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload falhou");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o áudio.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <audio controls src={value} className="h-9 flex-1" />
          <button type="button" onClick={() => onChange("")} aria-label="Remover música" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted hover:text-red-500">
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
              placeholder="https://.../musica.mp3"
            />
          ) : (
            <>
              <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music className="h-4 w-4" />}
                {loading ? "Enviando..." : "Enviar música do dispositivo"}
              </button>
              <p className="mt-1 text-xs font-semibold text-muted">MP3, OGG ou WAV — até {MAX_SECONDS}s e {Math.round(MAX_BYTES / 1024 / 1024)}MB. Corte um trecho curto antes de enviar.</p>
            </>
          )}
        </div>
      )}
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
