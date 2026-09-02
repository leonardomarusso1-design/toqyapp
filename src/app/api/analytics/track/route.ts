import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type TrackEventBody = {
  eventType: string;
  bioSiteId: string;
  buttonId?: string;
  buttonLabel?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * POST /api/analytics/track
 *
 * Grava um evento de analytics real (2026-07-16) — antes desta correção,
 * esta rota recebia o evento e DESCARTAVA (insert comentado como "TODO
 * Phase 8"), então o plano prometia "Analytics" mas nada era salvo.
 * Insert público via admin client (visitante do bio site nunca está
 * autenticado) — mesmo padrão de "grava mas só o dono lê" do resto do
 * projeto (ver toqy_analytics_events RLS).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TrackEventBody;

    if (!body.eventType || !body.bioSiteId) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!hasSupabaseEnv()) return Response.json({ success: false, error: "Servidor não configurado" }, { status: 500 });
    const supabase = getSupabaseAdmin()!;

    const allowed = await checkRateLimit(supabase, `analytics:${getClientIp(request)}`, 120, 60);
    if (!allowed) return Response.json({ success: true, skipped: "rate_limited" }, { status: 200 });

    // Achado real (auditoria 2026-09-01): insert público sem validar que
    // bioSiteId existe — qualquer um podia poluir a tabela com IDs
    // arbitrários (custo de storage, analytics falsos). Confere existência
    // antes de gravar; segue "best-effort" (nunca 500 pro visitante real).
    //
    // Bug real corrigido (mesmo dia, achado ao vivo em produção): o app
    // inteiro (PublicBioSite.tsx ao gravar, analytics/page.tsx ao ler)
    // sempre usou site_data->>'id' (o id gerado no client, dentro do JSON)
    // como identificador — NUNCA o id da linha (chave primária real da
    // tabela, gerada pelo Postgres). Os dois valores são diferentes desde
    // a criação de cada bio site (confirmado numa consulta direta). A
    // primeira versão desta checagem comparava contra o id da linha —
    // nunca batia com nada, e TODA visualização real ficou sendo
    // descartada silenciosamente (skipped: unknown_bio_site) desde o
    // deploy dessa validação. Corrigido pra checar contra o mesmo campo
    // que o resto do app usa de verdade.
    const { data: siteExists } = await supabase
      .from("toqy_biosites")
      .select("id")
      .eq("site_data->>id", body.bioSiteId)
      .maybeSingle();
    if (!siteExists) return Response.json({ success: true, skipped: "unknown_bio_site" }, { status: 200 });

    const userAgent = body.userAgent || request.headers.get("user-agent");
    const referer = request.headers.get("referer");

    const { error } = await supabase.from("toqy_analytics_events").insert({
      bio_site_id: body.bioSiteId,
      event_type: body.eventType,
      button_id: body.buttonId ?? null,
      button_label: body.buttonLabel ?? null,
      user_agent: userAgent,
      referer,
      metadata: body.metadata ?? null,
    });

    if (error) {
      // Analytics é "best-effort": nunca deve quebrar a experiência do
      // visitante. Se a tabela/coluna ainda não existe no banco (ambiente
      // sem migration aplicada) ou RLS bloqueou, loga no servidor e retorna
      // 200 pro cliente — o erro 500 anterior poluía o console do F12 e
      // atrapalhava o diagnóstico de bugs reais.
      console.error("[Analytics] Erro ao gravar evento:", error.message, error.code);
      return Response.json({ success: true, skipped: "analytics_unavailable" }, { status: 200 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    // Mesma lógica: best-effort. Erro inesperado não vira 500 visível.
    console.error("[Analytics] Error tracking event:", error instanceof Error ? error.message : String(error));
    return Response.json({ success: true, skipped: "analytics_error" }, { status: 200 });
  }
}
