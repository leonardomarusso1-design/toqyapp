"use client";

import type { ToqySite } from "./types";
import { mockSites, getMockSiteBySlug } from "./mockSites";
import { generateSlug } from "./security";

const STORAGE_KEY = "toqy_sites_v4";
const DELETED_MOCKS_KEY = "toqy_deleted_mock_sites_v1";

function isBrowser() { return typeof window !== "undefined"; }


function getDeletedMockSiteIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(DELETED_MOCKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function setDeletedMockSiteIds(ids: string[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DELETED_MOCKS_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function getStoredSites(): ToqySite[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredSites(sites: ToqySite[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export function getStoredSite(slugOrId: string) {
  return getStoredSites().find((site) => site.slug === slugOrId || site.id === slugOrId);
}

export function saveStoredSite(_site: ToqySite) {
  // localStorage desativado — dados salvos exclusivamente no Supabase
  // Limpa qualquer dado antigo que possa estar ocupando espaço
  try {
    window.localStorage.removeItem("toqy_sites_v4");
    window.localStorage.removeItem("toqy_deleted_mock_sites_v1");
  } catch { /* silencioso */ }
  return _site;
}

export function createStoredSite(site: ToqySite) {
  return saveStoredSite({ ...site, status: "active", slug: generateSlug(site.slug || site.profile.name) });
}

export function deleteStoredSite(id: string) {
  const site = getStoredSites().find((item) => item.id === id) ?? mockSites.find((item) => item.id === id);
  if (site && mockSites.some((mock) => mock.id === site.id)) {
    setDeletedMockSiteIds([...getDeletedMockSiteIds(), site.id]);
  }
  setStoredSites(getStoredSites().filter((item) => item.id !== id));
}

export function mergeMockAndStoredSites(): ToqySite[] {
  const stored = getStoredSites();
  const bySlug = new Map<string, ToqySite>();
  const deletedMockIds = new Set(getDeletedMockSiteIds());
  mockSites.filter((site) => !deletedMockIds.has(site.id)).forEach((site) => bySlug.set(site.slug, site));
  stored.forEach((site) => bySlug.set(site.slug, site));
  return Array.from(bySlug.values());
}

export function getSiteBySlug(slug: string) {
  const stored = getStoredSite(slug);
  if (stored) return stored;
  const mock = getMockSiteBySlug(slug);
  if (!mock) return undefined;
  return getDeletedMockSiteIds().includes(mock.id) ? undefined : mock;
}

export function validateClientKey(slug: string, key: string) {
  const site = getSiteBySlug(slug);
  if (!site) return null;
  return site.editKey.trim() === key.trim() ? site : null;
}

export function createPublicUrl(slug: string) {
  return `/b/${generateSlug(slug)}`;
}

export function createEditUrl(slug: string) {
  return `/editar/${generateSlug(slug)}`;
}

export { generateSlug };

// Compatibilidade com versões antigas do editor.
export function validateAccessKey(slug: string, key: string) {
  return Boolean(validateClientKey(slug, key));
}
