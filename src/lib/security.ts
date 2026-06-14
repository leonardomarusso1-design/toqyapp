export function generateId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function generateSlug(value: string) {
  return normalizeSlug(value || "novo-toqy") || "novo-toqy";
}

export function generateEditKey() {
  const a = Math.floor(1000 + Math.random() * 9000);
  const b = Math.floor(1000 + Math.random() * 9000);
  return `${a}-${b}`;
}

export function sanitizeText(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

export function ensureUrl(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|sms:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function normalizePhone(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

export function normalizeInstagram(value?: string) {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://instagram.com/${raw.replace(/^@/, "")}`;
}

export function isValidUrl(value?: string) {
  if (!value) return true;
  try {
    new URL(ensureUrl(value));
    return true;
  } catch {
    return false;
  }
}
