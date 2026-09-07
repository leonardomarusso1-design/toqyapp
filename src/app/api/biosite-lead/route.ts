import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Formulário de contato do bio site público (2026-09-07, referência
// Coonexta). Mesmo padrão de /api/analytics/track/route.ts: insert
// público via admin client (visitante nunca está autenticado), confere
// que o bio site existe pelo MESMO campo usado no resto do app
// (site_data->>'id', ver comentário grande naquele arquivo), rate limit
// por IP. Diferente de analytics: aqui um erro de gravação NÃO pode ser
// engolido silenciosamente (mesma lição de public.leads/api/lead — dado
// de contato perdido sem aviso é o pior tipo de bug nesta função).
const CONSENT_VERSION = "1.0";
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

type LeadBody = {
  bioSiteId?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  consent?: boolean;
};

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as LeadBody;
  const name = body.name?.trim().slice(0, MAX_NAME_LENGTH);
  const email = body.email?.trim().slice(0, MAX_EMAIL_LENGTH);
  const phone = body.phone?.trim().slice(0, MAX_PHONE_LENGTH);
  const message = body.message?.trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!body.bioSiteId || !name) {
    return Response.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!email && !phone) {
    return Response.json({ error: "Informe e-mail ou telefone." }, { status: 400 });
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return Response.json({ error: "E-mail inválido." }, { status: 400 });
  }
  // Consentimento explícito (LGPD art. 8º, §1º) — mesma regra de
  // /api/lead/route.ts: sem checkbox marcado, a requisição é recusada
  // antes de chegar perto do banco.
  if (body.consent !== true) {
    return Response.json({ error: "É preciso aceitar o uso dos dados para enviar." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;

  const allowed = await checkRateLimit(supabase, `biosite-lead:${getClientIp(request)}`, 5, 60);
  if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  // Confere que o bio site existe e está ativo antes de gravar — mesmo
  // achado da auditoria aplicado em analytics/track: sem isso, qualquer
  // um pode poluir a tabela com bio_site_id arbitrário.
  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("id, status")
    .eq("site_data->>id", body.bioSiteId)
    .maybeSingle();
  if (!site || site.status !== "active") {
    return Response.json({ error: "Bio site não encontrado." }, { status: 404 });
  }

  const { error } = await supabase.from("toqy_leads").insert({
    bio_site_id: body.bioSiteId,
    name,
    email: email || null,
    phone: phone || null,
    message: message || null,
    consent_version: CONSENT_VERSION,
    consented_at: new Date().toISOString(),
  });

  if (error) {
    // Diferente de analytics (best-effort): aqui é o único registro do
    // contato do visitante. Erro de gravação vira 500 de verdade — a
    // pessoa que preencheu o formulário precisa saber que não foi.
    console.error("[biosite-lead] falha ao gravar:", error.message, error.code);
    return Response.json({ error: "Não foi possível enviar. Tente novamente." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
