import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { resolveEffectiveOwnerPlan } from "@/lib/subscriptions";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { ToqySite } from "@/lib/types";

// Salvamento server-side pra quem está LOGADO (dono via sessão), criando ou
// editando o PRÓPRIO bio site — /app/novo e /onboarding.
//
// Achado real (2026-09-08, auditoria pedida pelo Leonardo: "confere o que
// vai ser bloqueado no gratuito e liberado apenas no pro"): antes desta
// rota, esse salvamento (syncBiositeToSupabase, em biositeSync.ts) escrevia
// DIRETO do navegador pro Supabase com o SDK client, autenticado só pela
// sessão do usuário. RLS de toqy_biosites valida "é dono da linha", mas não
// valida CAMPOS dentro do JSONB site_data — um usuário montando sua própria
// chamada à API do Supabase (fora da tela normal) podia setar
// site_data.ownerPlan pra um tier pago direto, e graças à trava-nunca-desce
// (resolveEffectiveOwnerPlan) esse valor nunca seria rebaixado de volta:
// Pix/Wi-Fi/Catálogo/White-label liberados pra sempre sem pagar.
//
// Fix: o cálculo de ownerPlan agora só roda AQUI, no servidor, lendo
// profiles.plan_toqy com a service role — o que o cliente mandar em
// site.ownerPlan é sempre ignorado. biositeSync.ts chama esta rota (com o
// access_token da sessão) em vez de escrever direto; local storage
// continua como fallback se a rede falhar, sem mudança nesse
// comportamento.
async function getAuthenticatedUserId(request: Request, supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) return Response.json({ ok: false, error: "Servidor não configurado" }, { status: 500 });
    const supabase = getSupabaseAdmin()!;

    const userId = await getAuthenticatedUserId(request, supabase);
    if (!userId) return Response.json({ ok: false, error: "Sem sessão ativa" }, { status: 401 });

    const allowed = await checkRateLimit(supabase, `biosite-sync:${userId}:${getClientIp(request)}`, 30, 60);
    if (!allowed) return Response.json({ ok: false, error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

    const body = await request.json();
    const site: ToqySite | undefined = body?.site;
    if (!site?.slug || !site.editKey) {
      return Response.json({ ok: false, error: "Dados inválidos" }, { status: 400 });
    }

    const [{ data: profile }, { data: existing }] = await Promise.all([
      supabase.from("profiles").select("plan_toqy").eq("id", userId).maybeSingle(),
      supabase.from("toqy_biosites").select("id, owner_profile_id, site_data").eq("slug", site.slug).maybeSingle(),
    ]);

    // Site já existe e é de OUTRA pessoa — nunca sobrescreve (colisão de
    // slug não é "editar", é um site diferente). O client-side antigo já
    // escopava o UPDATE por owner_profile_id (não dava pra sobrescrever
    // sem querer), mas aqui fica explícito e cedo, com erro claro.
    if (existing && existing.owner_profile_id !== userId) {
      return Response.json({ ok: false, error: "Este link já está em uso." }, { status: 409 });
    }

    const existingData = existing?.site_data as ToqySite | undefined;
    const effectivePlan = resolveEffectiveOwnerPlan(profile?.plan_toqy, existingData?.ownerPlan);
    const siteWithPlan: ToqySite = { ...site, ownerPlan: effectivePlan };

    if (existing) {
      const { error } = await supabase
        .from("toqy_biosites")
        .update({
          site_data: siteWithPlan,
          name: siteWithPlan.profile.name,
          status: site.status ?? "active",
          updated_at: new Date().toISOString(),
        })
        .eq("slug", site.slug)
        .eq("owner_profile_id", userId);
      if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("toqy_biosites")
        .insert({
          slug: site.slug,
          name: siteWithPlan.profile.name,
          status: site.status ?? "active",
          edit_key_hash: site.editKey, // trigger hash_biosite_edit_key faz o bcrypt (ver rotate-key/route.ts)
          owner_profile_id: userId,
          site_data: siteWithPlan,
        });
      if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true, ownerPlan: effectivePlan });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
