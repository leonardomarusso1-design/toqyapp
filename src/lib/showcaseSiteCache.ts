"use client";

import type { ToqySite } from "./types";

// Cache compartilhado no navegador entre todos os componentes que mostram
// preview de biosites reais (vitrine da landing + galeria de templates do
// editor) — evita repetir fetch do mesmo slug quando ele aparece em mais de
// um lugar (ex: marquee duplica cada card 2x pro loop contínuo).
const cache = new Map<string, Promise<ToqySite | null>>();

// Fila com concorrência limitada — bug real corrigido em 2026-07-06: a
// vitrine da landing tem 12 cards, cada um chamando fetchShowcaseSite no
// próprio mount, todos ao mesmo tempo. 12 requisições simultâneas pra
// /api/biosites/[slug] (cada uma lendo um JSONB pesado, com imagens em
// base64) sobrecarregava o Postgres/PostgREST e algumas estouravam o timeout
// de 10s do lado do cliente — por isso "alguns carrega, outros não", de
// forma inconsistente a cada carregamento. Mesmo padrão de lote pequeno já
// usado do lado do servidor (getShowcaseSites/getTemplatePreviews,
// BATCH_SIZE=3) — aqui replicado como fila de concorrência máxima 3 no
// navegador, com 1 nova tentativa pra quem falhar por timeout.
const MAX_CONCURRENT = 3;
let active = 0;
const queue: Array<() => void> = [];

function runQueued<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      active++;
      task()
        .then(resolve, reject)
        .finally(() => {
          active--;
          const next = queue.shift();
          if (next) next();
        });
    };
    if (active < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

async function fetchOnce(slug: string): Promise<ToqySite | null> {
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
}

export function fetchShowcaseSite(slug: string): Promise<ToqySite | null> {
  const cached = cache.get(slug);
  if (cached) return cached;

  const promise = runQueued(async () => {
    const first = await fetchOnce(slug);
    if (first) return first;
    return fetchOnce(slug); // 1 nova tentativa — mesma lógica de retry do lado do servidor
  });

  cache.set(slug, promise);
  return promise;
}
