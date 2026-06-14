"use client";

export function ImageUploadField({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (url: string) => void; placeholder?: string; pathPrefix?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <div className="mt-2 grid gap-3 md:grid-cols-[96px_1fr] md:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400">
          {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : "Preview"}
        </div>
        <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "Cole uma URL de imagem por enquanto"} />
      </div>
    </label>
  );
}
