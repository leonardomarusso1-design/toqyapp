import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { getMockSiteBySlug } from "@/lib/mockSites";
import { toPublicSite } from "@/lib/publicSite";
import type { ToqySite } from "@/lib/types";

type Params = { params: Promise<{ slug: string }> };

// Cache curto (Parte 4 da migração de imagens, 2026-07-06): depois de migrar
// as imagens pra Storage, a resposta já fica pequena (link em vez de
// base64) — cachear por alguns minutos reduz ainda mais a repetição de
// transferência pro mesmo slug (vitrine da landing, galeria de templates).
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin()!;
    const { data, error } = await supabase.from("toqy_biosites").select("*").eq("slug", slug).single();
    if (!error && data) {
      // Sanitizacao obrigatoria (2026-09-06, vulnerabilidade critica —
      // ver src/lib/publicSite.ts): esta rota e PUBLICA, sem nenhuma
      // autenticacao, e devolvia `site_data` cru — que carrega a chave
      // de edicao em texto puro. Confirmado ao vivo em producao antes da
      // correcao: GET /api/biosites/yakisabor entregava "editKey".
      const site = toPublicSite(data.site_data as ToqySite);

      // Plano de quem É DONO deste bio site, não de quem está pedindo
      // (2026-09-09, bug real reportado ao vivo com print: cliente da
      // agência do Leonardo — que pagou o plano Essencial — monta um
      // bio site e manda o link de edição pro CLIENTE DELE (sem conta,
      // só chave de acesso via /editar/[slug]?key=...); esse cliente
      // final abria o editor e via Catálogo/Pix/Wi-Fi bloqueados como
      // "Disponível a partir do plano Pro" — mesmo o dono tendo pago.
      // Causa raiz: SiteBuilder.tsx resolvia o plano via
      // `supabase.auth.getSession()` do NAVEGADOR de quem está editando
      // — pra um cliente final sem conta (só chave), não existe sessão
      // nenhuma, então caía sempre no fallback "free". Devolver aqui
      // (rota pública, sem autenticação, já usada pelo load inicial do
      // editor) o plano de quem É DONO de verdade resolve pros dois
      // casos: dono logado E cliente final sem conta.
      let ownerPlanTier: string | undefined;
      if (data.owner_profile_id) {
        const { data: profile } = await supabase.from("profiles").select("plan_toqy, plan_tier").eq("id", data.owner_profile_id).maybeSingle();
        ownerPlanTier = profile?.plan_toqy ?? profile?.plan_tier ?? undefined;
      }

      return Response.json(
        { site: { ...site, id: data.id, slug: data.slug, status: data.status }, ownerPlanTier, source: "supabase" },
        { headers: CACHE_HEADERS }
      );
    }
  }
  const site = getMockSiteBySlug(slug);
  if (!site) return Response.json({ error: "Bio site nao encontrado" }, { status: 404 });
  return Response.json({ site, source: "mock" }, { headers: CACHE_HEADERS });
}

// PATCH REMOVIDO (2026-09-06) — era uma vulnerabilidade crítica.
//
// A checagem de autorização estava DENTRO de um `if (edit_key)`:
//
//   if (edit_key) {
//     const { data: keyValid } = await supabase.rpc("verify_biosite_key", ...);
//     if (!keyValid) return 401;
//   }
//   await supabase.from("toqy_biosites").update({ site_data: site }).eq("slug", slug);
//
// Ou seja: bastava NÃO enviar `edit_key` para pular a verificação inteira
// e cair direto no `update`, que roda com service role (ignora RLS).
// Qualquer pessoa que soubesse o slug — e slugs são públicos, estão na
// URL — podia sobrescrever o bio site de qualquer cliente: trocar a
// CHAVE PIX (desviando pagamento), o número de WhatsApp (interceptando
// contato) ou tirar o site do ar.
//
// A rota foi REMOVIDA em vez de corrigida porque era código morto: nada
// no app a chamava (só `showcaseSiteCache.ts` usa o GET acima). O
// caminho real de salvamento é POST /api/biosite/save, que sempre exige
// a chave, valida por dono e tem rate limit.
