import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

// Excluir reserva (2026-09-08, pedido ao vivo: "quero ter acesso, pode
// excluir, responder, mandar mensagem.. tem que ter algo ali") — a tela
// de Agendamentos (/app/bookings) só listava, sem nenhuma ação. Mesmo
// padrão de auth de /api/qr-codes/[id]/route.ts (Bearer token + confere
// dono antes de mexer), porque toqy_bookings só tem policy de LEITURA
// pro dono (ver migration 2026-09-07_toqy_bookings.sql) — exclusão
// direta do client (RLS) seria negada, por isso passa pelo service_role
// aqui, depois de validar que o bio_site_id da reserva pertence ao
// usuário autenticado.
async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const { data: booking, error: findError } = await supabase
    .from("toqy_bookings")
    .select("id, bio_site_id")
    .eq("id", id)
    .maybeSingle();
  if (findError) return Response.json({ error: findError.message }, { status: 500 });
  if (!booking) return Response.json({ error: "Reserva não encontrada" }, { status: 404 });

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("id")
    .eq("site_data->>id", booking.bio_site_id)
    .eq("owner_profile_id", userId)
    .maybeSingle();
  if (!site) return Response.json({ error: "Reserva não encontrada" }, { status: 404 });

  const { error: deleteError } = await supabase.from("toqy_bookings").delete().eq("id", id);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });

  return Response.json({ ok: true });
}
