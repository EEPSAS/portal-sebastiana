import { describe, test, expect } from "vitest";
import { normalizarRole, getRotaInicial } from "./rolesRoutes";

/**
 * rolesRoutes.test.js - Testes Unitários de Normalização de Role e Rota Inicial
 */
describe("rolesRoutes", () => {
  test("normalizarRole converte aliases legados e aplica fallback para aluno", () => {
    expect(normalizarRole("padrao")).toBe("aluno");
    expect(normalizarRole("bibliotecario")).toBe("bibliotecaria");
    expect(normalizarRole("professor")).toBe("professor");
    expect(normalizarRole("especialista")).toBe("especialista");
    expect(normalizarRole("adm")).toBe("adm");
    expect(normalizarRole(undefined)).toBe("aluno");
    expect(normalizarRole(null)).toBe("aluno");
  });

  test("getRotaInicial retorna /dashboard/geral para todos os perfis oficiais", () => {
    for (const role of ["aluno", "padrao", "professor", "bibliotecaria", "especialista", "adm"]) {
      expect(getRotaInicial(role)).toBe("/dashboard/geral");
    }
  });
});
