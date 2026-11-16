import { describe, test, expect } from "vitest";
import {
  getCategoryFromApiType,
  getApiTypeFromCategory,
  getCategoryDetails,
} from "./agendaConfig";

/**
 * agendaConfig.test.js - Testes de Mapeamento de Categorias da Agenda
 */
describe("agendaConfig", () => {
  test("getCategoryFromApiType mapeia todos os tipos da API Laravel para chaves do frontend", () => {
    expect(getCategoryFromApiType("Eventos")).toBe("eventos");
    expect(getCategoryFromApiType("Provas e Trabalhos")).toBe("provas");
    expect(getCategoryFromApiType("Sábados Letivos")).toBe("sabados");
    expect(getCategoryFromApiType("Feriados e Recessos")).toBe("feriados");
    expect(getCategoryFromApiType("Datas Comemorativas")).toBe("comemorativas");
    expect(getCategoryFromApiType("Desconhecido")).toBe("eventos");
  });

  test("getApiTypeFromCategory e getCategoryDetails retornam valores canônicos", () => {
    expect(getApiTypeFromCategory("provas")).toBe("Provas e Trabalhos");
    expect(getApiTypeFromCategory("sabados")).toBe("Sábados Letivos");
    expect(getApiTypeFromCategory("feriados")).toBe("Feriados e Recessos");
    expect(getApiTypeFromCategory("inexistente")).toBe("Eventos");

    expect(getCategoryDetails("comemorativas").label).toBe("Datas Comemorativas");
    expect(getCategoryDetails("provas").eventLabel).toBe("Prova");
  });
});
