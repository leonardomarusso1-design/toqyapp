import { notFound, permanentRedirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

async function biositeExists(slug: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { data } = await supabase
    .from("toqy_biosites")
    .select("slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

// Fix (item 5 da auditoria): /[slug] e /b/[slug] serviam o MESMO bio site
// em duas URLs (conteudo duplicado pra SEO) e essa rota, quando o slug nao
// existia, retornava `null` — pagina em branco, sem 404 real. Agora /b/[slug]
// e a URL canonica (createPublicUrl/QR/copy-link sempre geram /b/...); esta
// rota so existe pra nao quebrar links antigos e redireciona 308 (permanente)
// pra la, ou devolve 404 de verdade se o slug nao existe.
export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Rotas do sistema — nunca chegam aqui na pratica (Next.js prioriza
  // segmentos estaticos sobre a rota dinamica), mas mantido por segurança.
  const reserved = ["app", "login", "me", "editar", "onboarding", "obrigado", "b", "api", "auth", "termos", "privacidade", "cookies", "demo", "portal", "qr", "contrato-assinatura"];
  if (reserved.includes(slug)) notFound();

  const exists = await biositeExists(slug);
  if (exists) permanentRedirect(`/b/${slug}`);
  notFound();
}

export const revalidate = 60;
