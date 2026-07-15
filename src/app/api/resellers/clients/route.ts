import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";

// Revenue Share — Agência (Fase 2 do roadmap, 2026-07-15) — revendedor
// convida um cliente por e-mail pra ficar visível no painel antes mesmo de
// ele se cadastrar. toqy_managed_clients não tem policy de INSERT
// client-side (ver supabase/migrations/2026-07-16_agency_revenue_share.sql),
// só o webhook e rotas com service role escrevem lá.
//
// Limitação real, documentada aqui de propósito: isso só pré-cadastra um
// cliente ESPERADO. O vínculo de verdade acontece no trigger
// handle_new_user() do banco, que só dispara em CADASTRO NOVO — se a
// pessoa convidada já tem conta Toqy, esse convite fica órfão
// (client_profile_id nunca é preenchido). Aceitável no volume atual (não
// resolvido agora). O fluxo por link (?revenda=CODIGO, ver src/lib/
// reseller.ts + login/page.tsx) funciona sozinho sem passar por aqui —
// esta rota é conveniência opcional, não dependência.
async function getAuthenticatedUserId(request: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

type CreateBody = { email?: string };

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });
  const supabase = getSupabaseAdmin()!;

  const userId = await getAuthenticatedUserId(request, supabase);
  if (!userId) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { data: reseller } = await supabase
    .from("toqy_resellers")
    .select("reseller_code")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!reseller) return Response.json({ error: "Você ainda não é um revendedor." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) return Response.json({ error: "E-mail é obrigatório" }, { status: 400 });

  // Índice único parcial (reseller_profile_id, lower(invite_email)) where
  // client_profile_id is null não mapeia limpo pro .upsert(onConflict) do
  // supabase-js — select-then-insert, idempotente (reenviar o mesmo convite
  // não duplica).
  const { data: existing } = await supabase
    .from("toqy_managed_clients")
    .select("*")
    .eq("reseller_profile_id", userId)
    .eq("invite_email", email)
    .is("client_profile_id", null)
    .maybeSingle();

  if (existing) return Response.json({ managedClient: existing });

  const { data: created, error: insertError } = await supabase
    .from("toqy_managed_clients")
    .insert({
      reseller_profile_id: userId,
      invite_email: email,
      reseller_code: reseller.reseller_code,
      status: "invited",
    })
    .select()
    .single();

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  return Response.json({ managedClient: created });
}
