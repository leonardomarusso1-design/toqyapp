"use client";

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
