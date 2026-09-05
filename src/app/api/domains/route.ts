import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { resolvePlanTier } from "@/lib/subscriptions";
import { addDomainToVercelProject, checkDomainVerification, isValidCustomDomain, removeDomainFromVercelProject } from "@/lib/vercelDomains";

/**
 * /api/domains — domínio próprio (feature Agência, 2026-09-05).
 *
 * GET    ?slug=xxx            -> status atual + reconsulta a Vercel (botão "Verificar")
 * POST   { slug, domain }     -> associa um domínio a um bio site do usuário
 * DELETE { slug }             -> remove o domínio do bio site e do projeto na Vercel
 *
 * Todas as rotas: exigem sessão (Bearer token), plano com hasCustomDomain,
 * e que o bio site pertença ao usuário autenticado (owner_profile_id).
 */

async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

// Domínio próprio (2026-09-05): Agência tem incluso na assinatura; Pro
// Pessoal precisa ter comprado o add-on avulso primeiro (custom_domain_addon,
// setado pelo webhook — ver OVERAGE_LINKS.customDomain em subscriptions.ts).
async function requireDomainEligible(supabase: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const { data: profile } = await supabase!.from("profiles").select("plan_toqy, plan_tier, custom_domain_addon").eq("id", userId).maybeSingle();
  const planTier = resolvePlanTier(profile?.plan_toqy ?? profile?.plan_tier);
  if (planTier === "agency") return true;
  return planTier === "pro" && profile?.custom_domain_addon === true;
}

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return Response.json({ error: "slug é obrigatório" }, { status: 400 });

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("id, custom_domain, custom_domain_status, owner_profile_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!site || site.owner_profile_id !== userId) return Response.json({ error: "Bio site não encontrado" }, { status: 404 });
  if (!site.custom_domain) return Response.json({ domain: null, status: null });

  const check = await checkDomainVerification(site.custom_domain);
  if (check.ok) {
    const newStatus = check.verified ? "verified" : "pending";
    if (newStatus !== site.custom_domain_status) {
      await supabase.from("toqy_biosites").update({ custom_domain_status: newStatus }).eq("id", site.id);
    }
    return Response.json({ domain: site.custom_domain, status: newStatus, verification: check.verification ?? null });
  }

  return Response.json({ domain: site.custom_domain, status: site.custom_domain_status, error: check.error });
}

type PostBody = { slug?: string; domain?: string };

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `domains:${getClientIp(request)}`, 10, 60);
  if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  const eligible = await requireDomainEligible(supabase, userId);
  if (!eligible) return Response.json({ error: "Domínio próprio é exclusivo do plano Agência ou do Pro Pessoal com o add-on de domínio comprado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as PostBody | null;
  const slug = body?.slug?.trim();
  const domain = body?.domain?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!slug || !domain) return Response.json({ error: "slug e domain são obrigatórios" }, { status: 400 });
  if (!isValidCustomDomain(domain)) return Response.json({ error: "Domínio inválido. Use o formato meusite.com.br, sem http:// nem barras." }, { status: 400 });

  const { data: site } = await supabase.from("toqy_biosites").select("id, owner_profile_id").eq("slug", slug).maybeSingle();
  if (!site || site.owner_profile_id !== userId) return Response.json({ error: "Bio site não encontrado" }, { status: 404 });

  // Domínio já em uso por outro bio site (o índice único no banco também
  // protege isso, mas checar antes dá uma mensagem legível em vez de erro
  // de constraint).
  const { data: existing } = await supabase.from("toqy_biosites").select("id").eq("custom_domain", domain).maybeSingle();
  if (existing && existing.id !== site.id) return Response.json({ error: "Esse domínio já está em uso por outro bio site." }, { status: 409 });

  const result = await addDomainToVercelProject(domain);
  if (!result.ok) return Response.json({ error: result.error }, { status: 502 });

  const status = result.verified ? "verified" : "pending";
  const { error: updateError } = await supabase
    .from("toqy_biosites")
    .update({ custom_domain: domain, custom_domain_status: status })
    .eq("id", site.id);

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

  return Response.json({ domain, status, verification: result.verification ?? null });
}

type DeleteBody = { slug?: string };

export async function DELETE(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as DeleteBody | null;
  const slug = body?.slug?.trim();
  if (!slug) return Response.json({ error: "slug é obrigatório" }, { status: 400 });

  const { data: site } = await supabase.from("toqy_biosites").select("id, owner_profile_id, custom_domain").eq("slug", slug).maybeSingle();
  if (!site || site.owner_profile_id !== userId) return Response.json({ error: "Bio site não encontrado" }, { status: 404 });
  if (!site.custom_domain) return Response.json({ ok: true });

  const removed = await removeDomainFromVercelProject(site.custom_domain);
  if (!removed.ok) return Response.json({ error: removed.error }, { status: 502 });

  const { error: updateError } = await supabase
    .from("toqy_biosites")
    .update({ custom_domain: null, custom_domain_status: null })
    .eq("id", site.id);
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

  return Response.json({ ok: true });
}
