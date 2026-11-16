import { describe, test, expect } from "vitest";
import {
  formatDateKey,
  getEaster,
  createImportantDates,
  formatMonth,
  getMonthKey,
  formatRelativeDate,
  getCalendarDays,
} from "./agendaUtils";

/**
 * agendaUtils.test.js - Testes Unitários de Cálculo de Datas, Páscoa e Grade do Calendário
 */
describe("agendaUtils", () => {
  test("formatDateKey e getMonthKey formatam datas no padrão ISO local", () => {
    const data = new Date(2026, 3, 5); // 05 de Abril de 2026
    expect(formatDateKey(data)).toBe("2026-04-05");
    expect(getMonthKey(data)).toBe("2026-04");
  });

  test("getEaster calcula o domingo de Páscoa exatamente para 2024, 2025 e 2026", () => {
    expect(formatDateKey(getEaster(2024))).toBe("2024-03-31");
    expect(formatDateKey(getEaster(2025))).toBe("2025-04-20");
    expect(formatDateKey(getEaster(2026))).toBe("2026-04-05");
  });

  test("createImportantDates inclui feriados fixos e móveis como Carnaval e Corpus Christi", () => {
    const datas = createImportantDates();
    const titulos = datas.map((d) => d.title);

    expect(titulos).toContain("Tiradentes");
    expect(titulos).toContain("Carnaval");
    expect(titulos).toContain("Sexta-feira Santa");
    expect(titulos).toContain("Corpus Christi");
  });

  test("formatMonth capitaliza o nome do mês em pt-BR e getCalendarDays gera matriz de 42 células", () => {
    const mes = new Date(2026, 9, 1); // Outubro de 2026
    expect(formatMonth(mes)).toMatch(/^Outubro de 2026$/i);

    const celulas = getCalendarDays(mes);
    expect(celulas).toHaveLength(42);
    expect(celulas.some((c) => c.currentMonth)).toBe(true);
  });

  test("formatRelativeDate calcula rótulos amigáveis para hoje, amanhã e ontem", () => {
    expect(formatRelativeDate("")).toBe("Nenhum dia selecionado");

    const hoje = new Date();
    const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
    const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);

    expect(formatRelativeDate(formatDateKey(hoje))).toBe("Hoje");
    expect(formatRelativeDate(formatDateKey(amanha))).toBe("Amanhã");
    expect(formatRelativeDate(formatDateKey(ontem))).toBe("Ontem");
  });
});
