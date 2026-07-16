import crypto from "crypto";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { resolvePlanTier, getPlan } from "@/lib/subscriptions";

// Persiste um QR Code avulso (Pix ou link personalizado) e devolve um slug
// público curto (2026-07-14, pedido do Leonardo) — o /app/qr antigo só
// gerava o QR na tela, sem link nenhum: pra gravar num chip NFC precisa de
// um LINK (NFC grava URL, não imagem nem texto solto), então essa rota
// existe pra dar um endereço fixo ("toqy.app/qr/xxxxx") que abre uma
// página mostrando o QR + copia-e-cola daquela pessoa — essa página é o
// link que vai dentro da tag.
type CreateBody = {
  mode: "pix" | "link";
  label?: string;
  pixKey?: string;
  pixReceiverName?: string;
  pixCity?: string;
  pixAmount?: number;
  targetUrl?: string;
};

async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  // Fix de segurança (2026-07-17, auditoria): QR Code personalizado é
  // recurso pago (hasCustomQr) — a UI já travava a aba pra plano
  // gratuito, mas essa rota nunca checava, então uma conta grátis
  // conseguia criar QR ilimitado chamando a API direto.
  const { data: profile } = await supabase.from("profiles").select("plan_toqy").eq("id", userId).maybeSingle();
  const plan = getPlan(resolvePlanTier(profile?.plan_toqy));
  if (!plan.hasCustomQr) {
    return Response.json({ error: "QR Code personalizado é um recurso pago. Faça upgrade de plano." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  if (!body?.mode || (body.mode !== "pix" && body.mode !== "link")) {
    return Response.json({ error: "mode inválido" }, { status: 400 });
  }
  if (body.mode === "pix" && !(body.pixKey?.trim() && body.pixReceiverName?.trim())) {
    return Response.json({ error: "Chave Pix e nome do recebedor são obrigatórios" }, { status: 400 });
  }
  if (body.mode === "link" && !body.targetUrl?.trim()) {
    return Response.json({ error: "Link é obrigatório" }, { status: 400 });
  }

  const { count: existingCount } = await supabase
    .from("toqy_qr_codes")
    .select("id", { count: "exact", head: true })
    .eq("owner_profile_id", userId);
  const seqNumber = (existingCount ?? 0) + 1;

  const slug = crypto.randomBytes(5).toString("base64url");

  const { data: qrCode, error: insertError } = await supabase
    .from("toqy_qr_codes")
    .insert({
      owner_profile_id: userId,
      seq_number: seqNumber,
      slug,
      mode: body.mode,
      label: body.label?.trim() || null,
      pix_key: body.mode === "pix" ? body.pixKey?.trim() : null,
      pix_receiver_name: body.mode === "pix" ? body.pixReceiverName?.trim() : null,
      pix_city: body.mode === "pix" ? body.pixCity?.trim() || null : null,
      pix_amount: body.mode === "pix" ? body.pixAmount || null : null,
      target_url: body.mode === "link" ? body.targetUrl?.trim() : null,
    })
    .select()
    .single();

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  return Response.json({ qrCode });
}

// Lista os QR Codes salvos do usuário (2026-07-14, pedido do Leonardo) —
// depois de gerar um link ele não conseguia ver de novo em lugar nenhum
// ("já criou 003 mas não consigo ver em personalizados").
export async function GET(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { data: qrCodes, error } = await supabase
    .from("toqy_qr_codes")
    .select("*")
    .eq("owner_profile_id", userId)
    .order("seq_number", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ qrCodes });
}
