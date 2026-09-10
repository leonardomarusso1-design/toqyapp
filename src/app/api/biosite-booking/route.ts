import { NextRequest } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabaseServer";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { generateSlotsForDay, resolveFixedTimes } from "@/lib/bookingSlots";
import { escapeHtml } from "@/lib/htmlEscape";
import type { BookingService, ToqySite } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Agendamento nativo (2026-09-07, referência Coonexta) — POST cria a
// reserva. Mesmo padrão de /api/biosite-lead/route.ts: insert público
// via admin client, confere que o bio site existe pelo MESMO campo
// usado no resto do app (site_data->>'id'), rate limit por IP. Erro de
// gravação NÃO pode ser engolido — é o único registro da reserva do
// visitante.
const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;
const MAX_NOTES_LENGTH = 500;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

type BookingBody = {
  bioSiteId?: string;
  serviceId?: string;
  name?: string;
  phone?: string;
  notes?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
};

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) return Response.json({ error: "Servidor não configurado" }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as BookingBody;
  const name = body.name?.trim().slice(0, MAX_NAME_LENGTH);
  const phone = body.phone?.trim().slice(0, MAX_PHONE_LENGTH);
  const notes = body.notes?.trim().slice(0, MAX_NOTES_LENGTH);

  if (!body.bioSiteId || !body.serviceId || !name || !phone || !body.date || !body.time) {
    return Response.json({ error: "Preencha nome, telefone, data e horário." }, { status: 400 });
  }
  if (!DATE_REGEX.test(body.date) || !TIME_REGEX.test(body.time)) {
    return Response.json({ error: "Data ou horário inválido." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin()!;

  const allowed = await checkRateLimit(supabase, `biosite-booking:${getClientIp(request)}`, 5, 60);
  if (!allowed) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

  const { data: site } = await supabase
    .from("toqy_biosites")
    .select("id, status, site_data, owner_profile_id")
    .eq("site_data->>id", body.bioSiteId)
    .maybeSingle();
  if (!site || site.status !== "active") {
    return Response.json({ error: "Bio site não encontrado." }, { status: 404 });
  }

  const siteData = site.site_data as ToqySite;
  const service = siteData.services?.find((s: BookingService) => s.id === body.serviceId && s.enabled);
  if (!service) {
    return Response.json({ error: "Serviço não encontrado ou indisponível." }, { status: 404 });
  }

  // Confere que o horário pedido ainda está na lista de horários
  // possíveis pro dia (dentro do expediente + sem conflito) — não
  // confia no que o cliente mandou, recalcula igual o GET de horários
  // disponíveis. Fecha a corrida (2 pessoas tentando o mesmo horário ao
  // mesmo tempo) com a MESMA checagem, feita de novo bem antes do insert.
  const [year, month, day] = body.date.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  const { data: existing } = await supabase
    .from("toqy_bookings")
    .select("booking_time")
    .eq("bio_site_id", body.bioSiteId)
    .eq("booking_date", body.date)
    .eq("status", "confirmed");
  const taken = (existing ?? []).map((r) => String(r.booking_time).slice(0, 5));

  const validSlots = generateSlotsForDay(siteData.businessHours, weekday, service.durationMinutes, siteData.bookingSlotMinutes ?? 30, taken, resolveFixedTimes(service, weekday));
  if (!validSlots.includes(body.time)) {
    return Response.json({ error: "Este horário não está mais disponível. Escolha outro." }, { status: 409 });
  }

  const { error } = await supabase.from("toqy_bookings").insert({
    bio_site_id: body.bioSiteId,
    service_id: service.id,
    service_name: service.name,
    customer_name: name,
    customer_phone: phone,
    notes: notes || null,
    booking_date: body.date,
    booking_time: body.time,
  });

  if (error) {
    console.error("[biosite-booking] falha ao gravar:", error.message, error.code);
    return Response.json({ error: "Não foi possível confirmar o agendamento. Tente novamente." }, { status: 500 });
  }

  // Notificação por e-mail pro dono (2026-09-09, pedido ao vivo: "quando
  // uma pessoa faz um agendamento, o comerciante recebe alguma
  // notificação?" — resposta era não). Best-effort: se o e-mail falhar,
  // o agendamento JÁ está gravado (é o dado que importa) — nunca falha a
  // resposta por causa disso, só loga. Ligado por padrão
  // (notifyBookingByEmail !== false).
  if (siteData.notifyBookingByEmail !== false && site.owner_profile_id) {
    await notifyOwnerByEmail(supabase, site.owner_profile_id, {
      siteName: siteData.profile?.name || "seu bio site",
      serviceName: service.name,
      customerName: name,
      customerPhone: phone,
      notes: notes || "",
      date: body.date,
      time: body.time,
    }).catch((err) => console.error("[biosite-booking] falha ao notificar dono:", err));
  }

  return Response.json({ ok: true });
}

async function notifyOwnerByEmail(
  supabase: SupabaseClient,
  ownerProfileId: string,
  booking: { siteName: string; serviceName: string; customerName: string; customerPhone: string; notes: string; date: string; time: string }
) {
  if (!process.env.RESEND_API_KEY) return;

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", ownerProfileId).maybeSingle();
  const ownerEmail = profile?.email;
  if (!ownerEmail) return;

  const dateBr = booking.date.split("-").reverse().join("/");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Toqy <noreply@toqy.com.br>",
      to: [ownerEmail],
      subject: `Novo agendamento — ${escapeHtml(booking.customerName)} em ${dateBr} às ${booking.time.slice(0, 5)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0b7a55;">Novo agendamento em ${escapeHtml(booking.siteName)}</h1>
          <table style="font-size: 16px; line-height: 1.8;">
            <tr><td style="color:#666;padding-right:12px;">Serviço</td><td><strong>${escapeHtml(booking.serviceName)}</strong></td></tr>
            <tr><td style="color:#666;padding-right:12px;">Cliente</td><td>${escapeHtml(booking.customerName)}</td></tr>
            <tr><td style="color:#666;padding-right:12px;">Telefone</td><td>${escapeHtml(booking.customerPhone)}</td></tr>
            <tr><td style="color:#666;padding-right:12px;">Quando</td><td>${dateBr} às ${booking.time.slice(0, 5)}</td></tr>
            ${booking.notes ? `<tr><td style="color:#666;padding-right:12px;vertical-align:top;">Observação</td><td>${escapeHtml(booking.notes)}</td></tr>` : ""}
          </table>
          <p style="font-size: 12px; color: #999; margin-top: 24px;">
            Você recebe este e-mail porque é dono de um bio site Toqy com agendamento ativado.
            Pra desligar, entre no editor, etapa "Serviços" (grupo Agenda) e desmarque
            "Avisar por e-mail quando alguém agendar".
          </p>
        </div>
      `,
    }),
  });
  if (!res.ok) console.error("[biosite-booking] Resend falhou:", res.status, await res.text().catch(() => ""));
}
