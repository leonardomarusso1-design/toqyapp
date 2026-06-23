"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";

const MAX_DIMENSION = 1280;
const MAX_BYTES = 8 * 1024 * 1024;

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
        resolve(canvas.toDataURL(mime, 0.85));
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
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  pathPrefix?: string;
  showPositionControl?: boolean;
  position?: string;
  onPositionChange?: (pos: string) => void;
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
      onChange(dataUrl);
    } catch {
      setError("Não foi possível carregar a imagem.");
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
        <span className="text-sm font-black text-slate-800">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-black text-slate-500 transition hover:text-[#1f9f87]"
        >
          <Link2 className="h-3.5 w-3.5" /> {showUrl ? "Enviar arquivo" : "Usar URL"}
        </button>
      </div>

      <div className="mt-2 grid gap-3 md:grid-cols-[96px_1fr] md:items-center">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400">
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
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-[#31c4a8] focus:ring-4 focus:ring-emerald-100"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:border-[#31c4a8] hover:text-[#1f9f87] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {loading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem do dispositivo"}
            </button>
            <p className="mt-1 text-xs font-semibold text-slate-400">JPG ou PNG, até 8MB. A imagem é otimizada automaticamente.</p>
          </div>
        )}
      </div>

      {/* Controle de posição (pincelada/zoom como Instagram) */}
      {showPositionControl && value && onPositionChange ? (
        <div className="mt-3">
          <span className="text-xs font-black text-slate-600">Posição da imagem</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {positions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPositionChange(p.value)}
                className={"rounded-xl border px-3 py-1.5 text-xs font-black transition " + (
                  (position ?? "center") === p.value
                    ? "border-[#31c4a8] bg-emerald-50 text-[#1f9f87]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
