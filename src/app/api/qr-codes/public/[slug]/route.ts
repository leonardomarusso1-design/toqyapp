import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Leitura pública de UM QR Code salvo, por slug (2026-09-08, auditoria de
// segurança) — usada pela página pública /qr/[slug] (StoredQrHub), que
// antes consultava toqy_qr_codes DIRETO do navegador com a chave anon.
//
// RISCO CRÍTICO encontrado e corrigido: a RLS de leitura pública dessa
// tabela era `using (true)` — ou seja, qualquer requisição anônima podia
// pedir a tabela INTEIRA (sem filtrar por slug) e baixar a chave Pix +
// nome do recebedor de TODOS os usuários do Toqy de uma vez. O filtro
// `.eq("slug", slug)` no client era só otimização de query, nunca uma
// fronteira de segurança de verdade (RLS avalia linha por linha,
// independente do que o client pediu no WHERE).
//
// Fix: mesmo padrão já usado por PublicBioSiteServer.tsx pro bio site
// público — o navegador não fala mais direto com o Supabase pra este
// dado. Esta rota usa o client admin (service_role, ignora RLS) faz a
// ÚNICA consulta permitida (por slug, uma linha), e a policy pública
// "true" foi removida do banco (ver migration
// 2026-09-08_restrict_qr_codes_public_read.sql) — mesmo que alguém pegue
// a chave anon do bundle, não tem mais como ler a tabela inteira.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const allowed = await checkRateLimit(supabase, `qr-public:${getClientIp(request)}`, 60, 60);
  if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  const { slug } = await params;
  const { data, error } = await supabase
    .from("toqy_qr_codes")
    .select("seq_number, mode, label, pix_key, pix_receiver_name, pix_city, pix_amount, target_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return Response.json({ error: "Erro ao buscar QR Code" }, { status: 500 });
  return Response.json({ qrCode: data ?? null });
}
