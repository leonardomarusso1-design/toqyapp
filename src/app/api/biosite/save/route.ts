import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { isPremiumPlan, resolvePlanTier } from "@/lib/subscriptions";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { ToqySite } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { site, editKey }: { site: ToqySite; editKey: string } = body;

    if (!site?.slug || !editKey) {
      return Response.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

    const allowed = await checkRateLimit(supabase, `biosite-save:${site.slug}:${getClientIp(request)}`, 15, 60);
    if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

    // Verificar chave de acesso
    const { data: existing } = await supabase
      .from("toqy_biosites")
      .select("id, owner_profile_id, site_data")
      .eq("slug", site.slug)
      .maybeSingle();

    if (!existing) return Response.json({ error: "Bio site não encontrado" }, { status: 404 });
    // Comparação via RPC (2026-07-17) — edit_key_hash agora é bcrypt de
    // verdade, verify_biosite_key() compara sem trazer o hash pro código.
    const { data: keyValid } = await supabase.rpc("verify_biosite_key", { p_slug: site.slug, p_key: editKey.trim() });
    if (!keyValid) return Response.json({ error: "Chave inválida" }, { status: 403 });

    // Buscar plano do dono
    const { data: profile } = await supabase
      .from("profiles").select("plan_toqy").eq("id", existing.owner_profile_id).maybeSingle();

    // "Ownerplan trava-nunca-desce" (mesma correção de biositeSync.ts,
    // 2026-09-01) — este é o caminho de save de quem edita via link+chave
    // (sem login, ex: cliente final de um revendedor). Sem isso, um bio site
    // já entregue com Pix/Wi-Fi/Catálogo perdia esses recursos assim que
    // fosse salvo de novo depois do dono (revendedor) cancelar o plano —
    // problema de quem nem tem relação com o pagamento do revendedor.
    const currentPlan = profile?.plan_toqy ?? "free";
    const existingData = existing.site_data as ToqySite | null;
    const previousPlan = resolvePlanTier(existingData?.ownerPlan);
    const effectivePlan = isPremiumPlan(resolvePlanTier(currentPlan)) ? currentPlan : (isPremiumPlan(previousPlan) ? previousPlan : currentPlan);

    // "Acesso do cliente" (2026-09-07, referência Coonexta) — este é o
    // caminho de save de quem tem só a CHAVE de edição, nunca o dono
    // logado (esse usa syncBiositeToSupabase, outro arquivo). Sem a
    // trava abaixo, um cliente com acesso restrito podia mandar
    // `clientAccessLevel: "full"` no próprio payload e se autopromover
    // — o campo nunca é lido do que o cliente mandou, só do que já
    // estava gravado; só o dono (via sessão) muda isso.
    const currentAccessLevel = existingData?.clientAccessLevel;
    if (currentAccessLevel === "readonly") {
      return Response.json({ error: "Este bio site está em modo somente leitura." }, { status: 403 });
    }
    const siteWithPlan = { ...site, ownerPlan: effectivePlan, clientAccessLevel: currentAccessLevel };

    const { error } = await supabase
      .from("toqy_biosites")
      .update({ site_data: siteWithPlan, name: siteWithPlan.profile.name, status: site.status ?? "active", updated_at: new Date().toISOString() })
      .eq("slug", site.slug);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
