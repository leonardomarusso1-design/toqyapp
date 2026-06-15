"use client";

/**
 * Camada de dados do TOQY (fase atual: mock + localStorage)
 * ------------------------------------------------------------
 * Fonte dos dados hoje:
 * - `src/lib/mockSites.ts`  -> bio sites de demonstração (somente leitura, fixos no código).
 * - `src/lib/siteStorage.ts` -> bio sites criados/editados pelo usuário, persistidos em
 *    `window.localStorage` (chave "toqy_sites_v4") e mesclados com os mocks via
 *    `mergeMockAndStoredSites()`.
 * - Este arquivo (`dataProvider.ts`) é o único ponto de entrada usado pelas páginas
 *   (`/app`, `/app/novo`, `/app/qr`, `/me`, `/editar/[slug]`) para listar, criar,
 *   salvar, duplicar, pausar/publicar e excluir bio sites, além de validar a chave
 *   de acesso do cliente.
 *
 * Próxima fase (Supabase) — NÃO conectado ainda, apenas o contrato sugerido:
 * - Criar `src/lib/dataProvider.supabase.ts` implementando as MESMAS funções
 *   exportadas aqui (mesma assinatura), porém:
 *     listBiosites()        -> SELECT * FROM sites (com RLS por usuário/conta)
 *     getBiositeById(id)     -> SELECT ... WHERE id = :id
 *     getBiositeBySlug(slug) -> SELECT ... WHERE slug = :slug
 *     saveBiosite(site)      -> UPSERT em sites (+ tabelas relacionadas: buttons, catalog)
 *     createBiosite(site)    -> INSERT em sites
 *     deleteBiosite(id)      -> DELETE (ou soft delete) em sites
 *     publishBiosite/pauseBiosite -> UPDATE status
 *     duplicateBiosite(id)   -> INSERT a partir de um SELECT existente
 *     validateClientKey(key, slug) -> SELECT comparando editKey (idealmente hash)
 * - Trocar a implementação por um "switch" simples baseado em
 *   `hasSupabaseBrowserEnv()` (já existe em `src/lib/supabaseBrowser.ts`):
 *   se houver env configurada, usar a versão Supabase; caso contrário, manter o
 *   fallback atual em localStorage. Assim o app continua funcionando em demos
 *   sem variáveis de ambiente.
 * - Nenhuma tabela, autenticação ou conexão Supabase foi criada nesta revisão.
 */

import { generateEditKey, generateId, generateSlug } from "./security";
import {
  createStoredSite,
  mergeMockAndStoredSites,
  saveStoredSite,
  deleteStoredSite,
} from "./siteStorage";
import type { ToqySite } from "./types";

export function listBiosites() {
  return mergeMockAndStoredSites();
}

export function getBiositeById(id: string) {
  return listBiosites().find((site) => site.id === id) ?? null;
}

export function getBiositeBySlug(slug: string) {
  return listBiosites().find((site) => site.slug === generateSlug(slug)) ?? null;
}

export function saveBiosite(site: ToqySite) {
  return saveStoredSite(site);
}

export function createBiosite(site: ToqySite) {
  return createStoredSite(site);
}

export function deleteBiosite(id: string) {
  deleteStoredSite(id);
}

function updateStatus(id: string, status: ToqySite["status"]) {
  const site = getBiositeById(id);
  if (!site) return null;
  return saveStoredSite({ ...site, status, updatedAt: new Date().toISOString() });
}

export function publishBiosite(id: string) {
  return updateStatus(id, "active");
}

export function pauseBiosite(id: string) {
  return updateStatus(id, "disabled");
}

export function duplicateBiosite(id: string) {
  const site = getBiositeById(id);
  if (!site) return null;
  const now = new Date().toISOString();
  return createStoredSite({
    ...site,
    id: generateId("site"),
    slug: generateSlug(`${site.slug}-copia`),
    profile: { ...site.profile, name: `${site.profile.name} cópia` },
    editKey: generateEditKey(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });
}

export function validateClientKey(key: string, slug?: string) {
  const cleanKey = key.trim();
  if (!cleanKey) return null;
  return (
    listBiosites().find((site) => {
      const sameKey = site.editKey.trim() === cleanKey;
      return slug ? sameKey && site.slug === generateSlug(slug) : sameKey;
    }) ?? null
  );
}
