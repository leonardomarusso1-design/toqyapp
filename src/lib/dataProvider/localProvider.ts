import { mockSites } from "../mockSites";
import { generateEditKey, generateId, generateSlug } from "../security";
import type { BioSite, DataProvider } from "./types";

const STORAGE_KEY = "toqy_sites_v4";
const DELETED_MOCKS_KEY = "toqy_deleted_mock_sites_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function cloneSite(site: BioSite): BioSite {
  return typeof structuredClone === "function" ? structuredClone(site) : JSON.parse(JSON.stringify(site));
}

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

export function getStoredSites(): BioSite[] {
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

export function setStoredSites(sites: BioSite[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export function listBiosites(): BioSite[] {
  const stored = getStoredSites();
  const deletedMockIds = new Set(getDeletedMockSiteIds());
  const bySlug = new Map<string, BioSite>();

  mockSites.filter((site) => !deletedMockIds.has(site.id)).forEach((site) => bySlug.set(site.slug, cloneSite(site)));
  stored.forEach((site) => bySlug.set(site.slug, cloneSite(site)));

  return Array.from(bySlug.values());
}

export function getBiositeById(id: string) {
  return listBiosites().find((site) => site.id === id) ?? null;
}

export function getBiositeBySlug(slug: string) {
  const normalizedSlug = generateSlug(slug);
  return listBiosites().find((site) => site.slug === normalizedSlug) ?? null;
}

export function saveBiosite(site: BioSite) {
  const sites = getStoredSites();
  const normalized = { ...site, slug: generateSlug(site.slug || site.profile.name), updatedAt: new Date().toISOString() };
  const index = sites.findIndex((item) => item.id === normalized.id || item.slug === normalized.slug);

  if (index >= 0) sites[index] = normalized;
  else sites.push(normalized);

  setStoredSites(sites);
  return normalized;
}

export function createBiosite(site: BioSite) {
  return saveBiosite({ ...site, status: "active", slug: generateSlug(site.slug || site.profile.name) });
}

export function deleteBiosite(id: string) {
  const site = getBiositeById(id);
  if (site && mockSites.some((mock) => mock.id === site.id)) {
    setDeletedMockSiteIds([...getDeletedMockSiteIds(), site.id]);
  }
  setStoredSites(getStoredSites().filter((item) => item.id !== id));
}

function updateStatus(id: string, status: BioSite["status"]) {
  const site = getBiositeById(id);
  if (!site) return null;
  return saveBiosite({ ...site, status, updatedAt: new Date().toISOString() });
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
  return createBiosite({
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

export function validateAccessKey(slug: string, key: string) {
  return Boolean(validateClientKey(key, slug));
}

export function createPublicUrl(slug: string) {
  return `/b/${generateSlug(slug)}`;
}

export function createEditUrl(slug: string) {
  return `/editar/${generateSlug(slug)}`;
}

export const localProvider: DataProvider = {
  listBiosites,
  getBiositeById,
  getBiositeBySlug,
  saveBiosite,
  createBiosite,
  deleteBiosite,
  publishBiosite,
  pauseBiosite,
  duplicateBiosite,
  validateClientKey,
  validateAccessKey,
  createPublicUrl,
  createEditUrl,
};
