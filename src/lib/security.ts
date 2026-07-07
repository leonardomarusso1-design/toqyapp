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

// Bug real de segurança corrigido em 2026-07-07: edit_key controla acesso
// total de edição do biosite — incluindo trocar a chave Pix do negócio — e
// só tinha ~26 bits de entropia (8 dígitos via Math.random, ~81 milhões de
// combinações). Sem nenhum limite de tentativas em /api/biosite/save, isso
// era forçável por força bruta em poucos dias. Corrigido em duas frentes:
// crypto.getRandomValues (não-previsível, ao contrário de Math.random) e
// um terceiro grupo de dígitos (~729 bilhões de combinações, ~39.4 bits —
// inviável de forçar mesmo sem rate limit), mantendo o formato numérico
// fácil de ditar por WhatsApp/telefone.
export function generateEditKey() {
  const bytes = crypto.getRandomValues(new Uint32Array(3));
  const [a, b, c] = Array.from(bytes, (n) => 1000 + (n % 9000));
  return `${a}-${b}-${c}`;
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
