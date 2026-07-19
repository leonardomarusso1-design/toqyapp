import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

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
