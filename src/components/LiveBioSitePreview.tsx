import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

export function LiveBioSitePreview({ site }: { site: ToqySite }) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] min-w-0 xl:block">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink shadow-sm">
        <span>Preview ao vivo</span><span className="text-accent">/b/{site.slug}</span>
      </div>
      <PhoneMockup className="mx-auto h-[calc(100%-4rem)] w-full max-w-[420px]">
        <PublicBioSite site={site} embedded />
      </PhoneMockup>
    </aside>
  );
}
