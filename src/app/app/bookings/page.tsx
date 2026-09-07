"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Phone, StickyNote } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { listBiositesFromSupabase } from "@/lib/biositeSync";
import { supabase } from "@/lib/supabaseClient";
import type { ToqySite } from "@/lib/types";

// Reservas do agendamento nativo (2026-09-07, referência Coonexta) —
// mesmo padrão de /app/leads/page.tsx: RLS (toqy_bookings_owner_read)
// já restringe a consulta às reservas dos bio sites do usuário logado;
// o filtro por site.id abaixo só organiza a exibição por página.
type Booking = {
  id: string;
  bio_site_id: string;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  booking_date: string;
  booking_time: string;
  created_at: string;
};

export default function BookingsPage() {
  const [sites, setSites] = useState<ToqySite[]>([]);
  const [bookingsBySite, setBookingsBySite] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const mySites = await listBiositesFromSupabase();
      if (!active) return;
      setSites(mySites);

      const { data } = await supabase
        .from("toqy_bookings")
        .select("id, bio_site_id, service_name, customer_name, customer_phone, notes, booking_date, booking_time, created_at")
        .eq("status", "confirmed")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (!active) return;

      const grouped: Record<string, Booking[]> = {};
      for (const booking of (data ?? []) as Booking[]) {
        (grouped[booking.bio_site_id] ??= []).push(booking);
      }
      setBookingsBySite(grouped);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const totalBookings = Object.values(bookingsBySite).reduce((sum, list) => sum + list.length, 0);

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-accent">Agendamento</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl text-ink">Reservas confirmadas</h1>
        <p className="mt-2 max-w-2xl text-muted">Horários agendados pelos visitantes direto no bio site. Cadastre serviços na etapa Agendamento de cada bio site.</p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted">Carregando...</p>
      ) : totalBookings === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-border p-10 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-bold text-muted">Nenhuma reserva ainda.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {sites.filter((site) => bookingsBySite[site.id]?.length).map((site) => (
            <section key={site.id}>
              <h2 className="text-lg font-black text-ink">{site.profile.name} <span className="font-semibold text-muted">— /{site.slug}</span></h2>
              <div className="mt-3 space-y-2">
                {bookingsBySite[site.id].map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-ink">{booking.customer_name} <span className="font-semibold text-muted">— {booking.service_name}</span></p>
                      <p className="text-xs font-semibold text-muted">{booking.booking_date.split("-").reverse().join("/")} às {booking.booking_time.slice(0, 5)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{booking.customer_phone}</span>
                    </div>
                    {booking.notes ? <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-ink"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />{booking.notes}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
