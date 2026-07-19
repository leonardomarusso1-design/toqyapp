"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, X, ZoomIn, ZoomOut } from "lucide-react";

export type CropAspectRatio = "square" | "4:3" | "16:9" | "4:5" | "free";

function getAspectRatioValue(aspectRatio: CropAspectRatio): number | undefined {
  if (aspectRatio === "square") return 1;
  if (aspectRatio === "4:3") return 4 / 3;
  if (aspectRatio === "16:9") return 16 / 9;
  if (aspectRatio === "4:5") return 4 / 5;
  return undefined;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function getCroppedImageDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas indisponível para recortar a imagem.");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ImageCropper({
  imageSrc,
  aspectRatio = "square",
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  aspectRatio?: CropAspectRatio;
  onConfirm: (croppedImage: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const aspect = useMemo(() => getAspectRatioValue(aspectRatio), [aspectRatio]);
  const frameClass = aspectRatio === "16:9" ? "aspect-video" : aspectRatio === "4:5" ? "aspect-[4/5]" : "aspect-square";

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedImage = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      await onConfirm(croppedImage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-5 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-ink">Ajustar imagem</h3>
            <p className="mt-1 text-sm text-muted">
              Escolha exatamente qual parte da foto vai aparecer no catálogo.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border p-2 text-muted transition hover:border-accent hover:text-accent-dim"
            aria-label="Fechar ajuste de imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`relative mt-5 w-full overflow-hidden rounded-2xl bg-surface ${frameClass}`}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid
            objectFit="contain"
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((current) => Math.max(1, current - 0.1))}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim"
          >
            <ZoomOut className="h-4 w-4" />
            Menos zoom
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => setZoom((current) => Math.min(3, current + 0.1))}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim"
          >
            <ZoomIn className="h-4 w-4" />
            Mais zoom
          </button>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-black text-muted transition hover:border-accent hover:text-accent-dim"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !croppedAreaPixels}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-black text-white transition hover:bg-accent-dim disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {loading ? "Aplicando..." : "Usar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
