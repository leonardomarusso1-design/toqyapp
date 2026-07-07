"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";

const MAX_DIMENSION = 800; // reduzido de 1280 — suficiente para bio site mobile
const MAX_BYTES = 5 * 1024 * 1024; // reduzido de 8MB para 5MB

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(mime, mime === "image/png" ? 0.9 : 0.75));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder,
  showPositionControl,
  position,
  onPositionChange,
  slug,
  fieldId,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  pathPrefix?: string;
  showPositionControl?: boolean;
  position?: string;
  onPositionChange?: (pos: string) => void;
  // Bug real corrigido em 2026-07-06: antes a imagem ia direto como base64
  // pro site_data (estourou o limite de bandwidth da Vercel — ver
  // src/lib/imageStorage.ts). Agora sobe pro Supabase Storage e só o link
  // público entra no site. slug/fieldId identificam onde salvar o arquivo.
  slug?: string;
  fieldId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Selecione um arquivo de imagem."); return; }
    if (file.size > MAX_BYTES) { setError("Imagem muito grande (máx. 8MB)."); return; }
    setError("");
    setLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      if (!slug || !fieldId) {
        // Sem slug/fieldId (uso legado/isolado) — mantém o comportamento
        // anterior em vez de quebrar quem ainda não passou essas props.
        onChange(dataUrl);
        return;
      }
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, slug, fieldId }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload falhou");
      onChange(data.url);
    } catch {
      setError("Não foi possível enviar a imagem.");
    } finally {
      setLoading(false);
      // Reseta o input para permitir selecionar o mesmo arquivo novamente
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const positions = [
    { label: "Topo", value: "top" },
    { label: "Centro", value: "center" },
    { label: "Baixo", value: "bottom" },
    { label: "Esquerda", value: "left" },
    { label: "Direita", value: "right" },
  ];

  return (
    <div className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-ink">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-black text-muted transition hover:text-accent-dim"
        >
          <Link2 className="h-3.5 w-3.5" /> {showUrl ? "Enviar arquivo" : "Usar URL"}
        </button>
      </div>

      <div className="mt-2 grid gap-3 md:grid-cols-[96px_1fr] md:items-center">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface text-xs font-bold text-muted">
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
              style={{ objectPosition: position ?? "center" }}
            />
          ) : "Preview"}
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remover imagem"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {showUrl ? (
          <input
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "Cole o link (URL) da imagem"}
          />
        ) : (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {loading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem do dispositivo"}
            </button>
            <p className="mt-1 text-xs font-semibold text-muted">JPG ou PNG, até 8MB. A imagem é otimizada automaticamente.</p>
          </div>
        )}
      </div>

      {/* Controle de posição (pincelada/zoom como Instagram) */}
      {showPositionControl && value && onPositionChange ? (
        <div className="mt-3">
          <span className="text-xs font-black text-muted">Posição da imagem</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {positions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPositionChange(p.value)}
                className={"rounded-xl border px-3 py-1.5 text-xs font-black transition " + (
                  (position ?? "center") === p.value
                    ? "border-accent bg-accent/10 text-accent-dim"
                    : "border-border bg-card text-muted hover:border-accent"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
