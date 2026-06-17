import type { ToqySite } from "./types";

// Mocks REMOVIDOS — todos os bio sites vêm exclusivamente do Supabase.
// Estes stubs existem apenas para compatibilidade com imports legados.
export const mockSites: ToqySite[] = [];

export function getMockSiteBySlug(_slug: string): ToqySite | undefined {
  return undefined;
}

export const demoSlugs: string[] = [];

export function getMockSites(): ToqySite[] {
  return [];
}

export function isDemoSlug(_slug: string) {
  return false;
}

export function isMockOwner(_email?: string | null) {
  return false;
}
