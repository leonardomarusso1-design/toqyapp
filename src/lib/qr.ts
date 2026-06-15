import { createPublicUrl } from "./siteStorage";

export function createPublicQrValue(origin: string, slug: string) {
  return `${origin.replace(/\/$/, "")}${createPublicUrl(slug)}`;
}
