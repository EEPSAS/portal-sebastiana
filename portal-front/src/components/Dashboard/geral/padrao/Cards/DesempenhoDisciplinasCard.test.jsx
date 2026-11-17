import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DesempenhoDisciplinasCard from "./DesempenhoDisciplinasCard";

describe("DesempenhoDisciplinasCard", () => {
  const dadosDisciplinasMock = {
    melhores: [
      { posicao: 1, nome: "Matemática", valor: 9.5 },
      { posicao: 2, nome: "História", valor: 8.0 },
    ],
    piores: [
      { posicao: 1, nome: "Física", valor: 4.5 },
    ],
  };

  const dadosFrequenciasMock = {
    melhores: [
      { posicao: 1, nome: "Biologia", valor: 100 },
    ],
    piores: [
      { posicao: 1, nome: "Química", valor: 72 },
    ],
  };

  it("renderiza o card de desempenho com padrão visual de notas e permite alternar para frequência", () => {
    render(
      <DesempenhoDisciplinasCard
        dadosDisciplinas={dadosDisciplinasMock}
        dadosFrequencias={dadosFrequenciasMock}
      />
    );

    // Modo Notas ativo por padrão
    expect(screen.getByText("Desempenho por Notas")).toBeInTheDocument();
    expect(screen.getByText("Notas & Avaliações")).toBeInTheDocument();
    expect(screen.getByText("Matemática")).toBeInTheDocument();
    expect(screen.getByText("Física")).toBeInTheDocument();

    // Alterna para Frequência
    const botaoFreq = screen.getByRole("button", { name: "Frequência" });
    fireEvent.click(botaoFreq);

    expect(screen.getByText("Desempenho por Frequência")).toBeInTheDocument();
    expect(screen.getByText("Presença & Diário")).toBeInTheDocument();
    expect(screen.getByText("Biologia")).toBeInTheDocument();
    expect(screen.getByText("Química")).toBeInTheDocument();
  });
});
