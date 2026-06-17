import type { CatalogItem as ToqyCatalogItem, ToqyButton, ToqySite } from "../types";

export type BioSite = ToqySite;

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  siteIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogItem = ToqyCatalogItem;
export type SiteButton = ToqyButton;
export type PixConfig = ToqySite["pix"];
export type WifiConfig = ToqySite["wifi"];

export type ClientKey = {
  siteId: string;
  slug: string;
  key: string;
  createdAt?: string;
};

export type DataProvider = {
  listBiosites: (ownerEmail?: string | null) => BioSite[];
  getBiositeById: (id: string) => BioSite | null;
  getBiositeBySlug: (slug: string) => BioSite | null;
  saveBiosite: (site: BioSite) => BioSite;
  createBiosite: (site: BioSite) => BioSite;
  deleteBiosite: (id: string) => void;
  publishBiosite: (id: string) => BioSite | null;
  pauseBiosite: (id: string) => BioSite | null;
  duplicateBiosite: (id: string) => BioSite | null;
  validateClientKey: (key: string, slug?: string) => BioSite | null;
  validateAccessKey: (slug: string, key: string) => boolean;
  createPublicUrl: (slug: string) => string;
  createEditUrl: (slug: string) => string;
};
