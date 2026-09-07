import type { BusinessHours } from "./types";

// Cálculo de horários disponíveis (2026-09-07, referência Coonexta —
// agendamento nativo). Puro, sem I/O — fácil de testar. Reaproveita
// BusinessHours (o mesmo horário de funcionamento que já existe pro
// card "Aberto agora") como disponibilidade: não existe um sistema de
// "dias liberados" separado.
export function generateSlotsForDay(
  businessHours: BusinessHours | undefined,
  weekday: number,
  durationMinutes: number,
  slotIntervalMinutes = 30,
  takenTimes: string[] = []
): string[] {
  const day = businessHours?.days.find((d) => d.weekday === weekday);
  if (!businessHours?.enabled || !day || day.closed) return [];

  const [openH, openM] = day.open.split(":").map(Number);
  const [closeH, closeM] = day.close.split(":").map(Number);
  const openMin = openH * 60 + openM;
  let closeMin = closeH * 60 + closeM;
  // Expediente vira a madrugada (ex: 18h às 02h) — mesmo tratamento do
  // card "Aberto agora": soma 24h no fechamento pra virar um intervalo
  // contínuo de minutos.
  if (closeMin <= openMin) closeMin += 24 * 60;

  const taken = new Set(takenTimes);
  const slots: string[] = [];
  for (let start = openMin; start + durationMinutes <= closeMin; start += slotIntervalMinutes) {
    const h = Math.floor(start / 60) % 24;
    const m = start % 60;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (!taken.has(label)) slots.push(label);
  }
  return slots;
}
