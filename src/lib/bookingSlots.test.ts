import { describe, expect, it } from "vitest";
import { generateSlotsForDay, resolveFixedTimes } from "./bookingSlots";
import type { BusinessHours } from "./types";

const hours: BusinessHours = {
  enabled: true,
  days: [
    { weekday: 1, closed: false, open: "08:00", close: "20:00" },
    { weekday: 0, closed: true, open: "08:00", close: "20:00" },
  ],
};

describe("generateSlotsForDay", () => {
  it("gera slots pelo intervalo quando não há horários fixos", () => {
    const slots = generateSlotsForDay(hours, 1, 60, 60);
    expect(slots[0]).toBe("08:00");
    expect(slots).toContain("19:00");
    expect(slots).not.toContain("19:30");
  });

  it("usa exatamente os horários fixos e ignora intervalo/duração", () => {
    const slots = generateSlotsForDay(hours, 1, 999, 15, [], ["18:30", "16:00", "08:30", "19:30"]);
    expect(slots).toEqual(["08:30", "16:00", "18:30", "19:30"]);
  });

  it("horário fixo já reservado some da lista", () => {
    const slots = generateSlotsForDay(hours, 1, 60, 30, ["18:30"], ["16:00", "18:30", "19:30"]);
    expect(slots).toEqual(["16:00", "19:30"]);
  });

  it("dia fechado não tem horário nem com horários fixos", () => {
    expect(generateSlotsForDay(hours, 0, 60, 30, [], ["18:30"])).toEqual([]);
  });

  it("lista fixa vazia = usa horário fixo mas 0 slots nesse dia", () => {
    expect(generateSlotsForDay(hours, 1, 60, 30, [], [])).toEqual([]);
  });
});

describe("resolveFixedTimes", () => {
  const svc = { fixedTimes: ["19:30"], fixedTimesByWeekday: { 5: [], 1: ["18:30", "19:30"] } };

  it("dia sem override usa a lista padrão", () => {
    expect(resolveFixedTimes(svc, 3)).toEqual(["19:30"]);
  });
  it("dia com override usa a lista do dia", () => {
    expect(resolveFixedTimes(svc, 1)).toEqual(["18:30", "19:30"]);
  });
  it("override com lista vazia (sexta sem aula) devolve []", () => {
    expect(resolveFixedTimes(svc, 5)).toEqual([]);
  });
  it("serviço sem horário fixo devolve undefined", () => {
    expect(resolveFixedTimes({}, 2)).toBeUndefined();
  });
});
