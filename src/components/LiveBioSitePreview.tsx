import type { ToqySite } from "@/lib/types";
import { PublicBioSite } from "./PublicBioSite";
import { PhoneMockup } from "./PhoneMockup";

export function LiveBioSitePreview({ site, onStickerMove }: { site: ToqySite; onStickerMove?: (id: string, x: number, y: number) => void }) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] min-w-0 xl:block">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-ink shadow-sm">
        <span>Preview ao vivo</span><span className="text-accent">/b/{site.slug}</span>
      </div>
      <PhoneMockup className="mx-auto h-[calc(100%-4rem)] w-full max-w-[420px]">
        {/* instanceId obrigatorio aqui (2026-09-06): sem ele, o
            PublicBioSite conta um page_view a cada vez que o preview
            monta — ou seja, o proprio dono editando inflava as visitas
            do bio site dele. So a pagina publica de verdade (sem
            instanceId) deve contar. */}
        <PublicBioSite site={site} instanceId="editor" onStickerMove={onStickerMove} />
      </PhoneMockup>
    </aside>
  );
}
