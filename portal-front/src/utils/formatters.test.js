import { describe, test, expect } from "vitest";
import { formatarDisciplinaCiclo } from "./formatters";

/**
 * formatters.test.js - Testes Unitários de Formatação Pedagógica (NOME + CICLO)
 */
describe("formatarDisciplinaCiclo", () => {
  test("retorna string vazia quando disciplina é nula ou indefinida", () => {
    expect(formatarDisciplinaCiclo(null)).toBe("");
    expect(formatarDisciplinaCiclo(undefined)).toBe("");
  });

  test("concatena nome da disciplina com ciclo contextual, array de ciclos ou ciclo_nome", () => {
    expect(formatarDisciplinaCiclo("Língua Portuguesa", "1º Ano")).toBe(
      "Língua Portuguesa - 1º Ano"
    );

    expect(
      formatarDisciplinaCiclo({
        nome: "Matemática",
        ciclos: [{ nome: "1º Ano" }, { nome: "2º Ano" }],
      })
    ).toBe("Matemática - 1º Ano / 2º Ano");

    expect(
      formatarDisciplinaCiclo({
        nome: "História",
        ciclo_nome: "Ensino Médio",
      })
    ).toBe("História - Ensino Médio");

    expect(formatarDisciplinaCiclo({ nome: "Educação Física" })).toBe("Educação Física");
  });
});
