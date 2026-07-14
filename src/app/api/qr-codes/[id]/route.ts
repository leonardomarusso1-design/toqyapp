import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

// Edita um QR Code salvo SEM trocar o slug/link (2026-07-14, pedido do
// Leonardo) — ele quer poder atualizar a chave Pix, nome, valor etc. de um
// QR que já está impresso numa plaquinha física, sem precisar reimprimir
// nada: a plaquinha continua com o mesmo link/QR, só o conteúdo por trás
// dele muda (mesma lógica do concorrente visto no vídeo — "Gerenciar QR",
// edita o destino sem trocar o QR impresso).
type UpdateBody = {
  label?: string;
  pixKey?: string;
  pixReceiverName?: string;
  pixCity?: string;
  pixAmount?: number | null;
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const { data: existing, error: findError } = await supabase
    .from("toqy_qr_codes")
    .select("id, owner_profile_id, mode")
    .eq("id", id)
    .maybeSingle();

  if (findError) return Response.json({ error: findError.message }, { status: 500 });
  if (!existing || existing.owner_profile_id !== userId) {
    return Response.json({ error: "QR Code não encontrado" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body) return Response.json({ error: "Corpo inválido" }, { status: 400 });

  if (existing.mode === "pix" && !(body.pixKey?.trim() && body.pixReceiverName?.trim())) {
    return Response.json({ error: "Chave Pix e nome do recebedor são obrigatórios" }, { status: 400 });
  }
  if (existing.mode === "link" && !body.targetUrl?.trim()) {
    return Response.json({ error: "Link é obrigatório" }, { status: 400 });
  }

  const { data: qrCode, error: updateError } = await supabase
    .from("toqy_qr_codes")
    .update({
      label: body.label?.trim() || null,
      pix_key: existing.mode === "pix" ? body.pixKey?.trim() : null,
      pix_receiver_name: existing.mode === "pix" ? body.pixReceiverName?.trim() : null,
      pix_city: existing.mode === "pix" ? body.pixCity?.trim() || null : null,
      pix_amount: existing.mode === "pix" ? body.pixAmount || null : null,
      target_url: existing.mode === "link" ? body.targetUrl?.trim() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  return Response.json({ qrCode });
}
