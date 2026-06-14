import { QrCode } from "lucide-react";
import { getSiteBackground } from "@/lib/utils";
import type { ToqySite } from "@/lib/types";

export function PlaquePreview({ site, link = `/${site.slug}` }: { site: ToqySite; link?: string }) {
  return (
    <div
      className="overflow-hidden rounded-[2rem] border border-white/10 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.32)]"
      style={{ background: getSiteBackground(site), color: site.theme.text }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Toqy NFC</p>
          <h3 className="mt-2 text-2xl font-black">{site.profile.name}</h3>
          <p className="mt-1 text-sm opacity-75">Aproxime ou escaneie</p>
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-3 text-black">
          <QrCode className="h-12 w-12" />
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-white/15 bg-black/20 p-4 text-xs font-bold backdrop-blur">
        {link}
      </div>
    </div>
  );
}
