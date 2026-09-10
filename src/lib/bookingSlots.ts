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
  takenTimes: string[] = [],
  // Horários fixos JÁ RESOLVIDOS pro dia da semana pedido (academia de
  // luta/dança etc). Use resolveFixedTimes(service, weekday) pra montar.
  //   undefined  -> serviço não usa horário fixo: gera pelo intervalo.
  //   []         -> usa horário fixo, mas esse dia não tem nenhum: 0 slots.
  //   ["HH:MM"]  -> esses são os únicos horários (ignora duração/intervalo).
  // Dia fechado no horário de funcionamento nunca agenda, de qualquer forma.
  fixedTimes?: string[]
): string[] {
  const day = businessHours?.days.find((d) => d.weekday === weekday);
  if (!businessHours?.enabled || !day || day.closed) return [];

  if (fixedTimes) {
    const taken = new Set(takenTimes);
    return [...new Set(fixedTimes)]
      .filter((t) => /^\d{2}:\d{2}$/.test(t) && !taken.has(t))
      .sort();
  }

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

// Resolve os horários fixos que valem pra um dia da semana específico.
// Prioridade: override por dia (fixedTimesByWeekday[weekday], mesmo que
// seja lista vazia = "sem horário nesse dia") -> lista padrão (fixedTimes)
// -> undefined (serviço não usa horário fixo).
export function resolveFixedTimes(
  service: { fixedTimes?: string[]; fixedTimesByWeekday?: Record<number, string[]> },
  weekday: number
): string[] | undefined {
  const perDay = service.fixedTimesByWeekday?.[weekday];
  if (perDay !== undefined) return perDay;
  return service.fixedTimes;
}
