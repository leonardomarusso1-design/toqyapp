"use client";

import type { ToqySite } from "./types";

// Cache compartilhado no navegador entre todos os componentes que mostram
// preview de biosites reais (vitrine da landing + galeria de templates do
// editor) — evita repetir fetch do mesmo slug quando ele aparece em mais de
// um lugar (ex: marquee duplica cada card 2x pro loop contínuo).
const cache = new Map<string, Promise<ToqySite | null>>();

export function fetchShowcaseSite(slug: string): Promise<ToqySite | null> {
  const cached = cache.get(slug);
  if (cached) return cached;

  const promise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`/api/biosites/${slug}`, { signal: controller.signal });
      if (!res.ok) return null;
      const data: { site?: ToqySite } = await res.json();
      return data.site ?? null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  })();

  cache.set(slug, promise);
  return promise;
}
