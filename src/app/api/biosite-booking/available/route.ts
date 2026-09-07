import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { generateSlotsForDay } from "@/lib/bookingSlots";
import type { ToqySite } from "@/lib/types";

// Horários disponíveis pra um dia (2026-09-07, referência Coonexta —
// passo "escolher horário" do agendamento). Rota PÚBLICA só de leitura,
// mas nunca expõe dado de outro cliente: devolve só a LISTA de horários
// livres, nunca quem reservou o quê (RLS de toqy_bookings já bloqueia
// isso pra anon, mas esta rota nem tenta — usa admin client só pra
// contar horários ocupados, e devolve apenas "HH:MM" na resposta).
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const bioSiteId = searchParams.get("bioSiteId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!bioSiteId || !serviceId || !date || !DATE_REGEX.test(date)) {
    return Response.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("status, site_data")
    .eq("site_data->>id", bioSiteId)
    .maybeSingle();
  if (!site || site.status !== "active") {
    return Response.json({ error: "Bio site não encontrado." }, { status: 404 });
  }

  const siteData = site.site_data as ToqySite;
  const service = siteData.services?.find((s) => s.id === serviceId && s.enabled);
  if (!service) {
    return Response.json({ error: "Serviço não encontrado ou indisponível." }, { status: 404 });
  }

  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();

  const { data: existing } = await supabase
    .from("toqy_bookings")
    .select("booking_time")
    .eq("bio_site_id", bioSiteId)
    .eq("booking_date", date)
    .eq("status", "confirmed");
  const taken = (existing ?? []).map((r) => String(r.booking_time).slice(0, 5));

  const slots = generateSlotsForDay(siteData.businessHours, weekday, service.durationMinutes, siteData.bookingSlotMinutes ?? 30, taken);
  return Response.json({ slots });
}
