import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";

export function LiveBioSitePreview({ site }: { site: ToqySite }) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] min-w-0 xl:block">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
        <span>Preview ao vivo</span><span className="text-blue-600">/b/{site.slug}</span>
      </div>
      <div className="mx-auto h-[calc(100%-4rem)] w-full max-w-[420px] overflow-hidden rounded-[2.5rem] border-[10px] border-slate-950 bg-slate-950 shadow-2xl">
        <div className="h-full overflow-y-auto"><PublicBioSite site={site} /></div>
      </div>
    </aside>
  );
}
