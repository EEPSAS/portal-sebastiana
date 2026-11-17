import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router";
import DesempenhoAlunosCard from "./DesempenhoAlunosCard";

describe("DesempenhoAlunosCard", () => {
  const disciplinasMock = [
    {
      id: "1",
      nome: "Matemática",
      rotuloCompleto: "Matemática - 1º Ano - Ensino Médio",
      aulas_semanais: 3,
      carga_horaria_anual: 120,
      turmas: [{ id_turma: 1, nome_identificador: "1º Ano A" }],
      desempenho: {
        nota: {
          piores: [
            { posicao: 1, id: "n-1", nome: "Carlos Risco", turma: "1º Ano A", valor: 45.0 },
          ],
          melhores: [
            { posicao: 1, id: "n-2", nome: "Ana Destaque", turma: "1º Ano A", valor: 95.0 },
          ],
        },
        frequencia: {
          piores: [
            { posicao: 1, id: "f-1", nome: "Marcos Falta", turma: "1º Ano A", valor: 70.0 },
          ],
          melhores: [
            { posicao: 1, id: "f-2", nome: "Julia Presente", turma: "1º Ano A", valor: 100.0 },
          ],
        },
      },
    },
  ];

  it("renderiza rankings de pior e melhor desempenho e permite alternar entre nota e frequência", () => {
    const onSelecionarDiscMock = vi.fn();

    render(
      <MemoryRouter>
        <DesempenhoAlunosCard
          disciplinas={disciplinasMock}
          disciplinaSelecionadaId="1"
          onSelecionarDisciplina={onSelecionarDiscMock}
          divisaoNome="3º Trimestre"
          pontosDivisao={40}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Desempenho dos Alunos")).toBeInTheDocument();
    expect(screen.getByText("Pior Desempenho")).toBeInTheDocument();
    expect(screen.getByText("Melhor Desempenho")).toBeInTheDocument();

    // Visualização padrão: Por Nota
    expect(screen.getByText("Carlos Risco")).toBeInTheDocument();
    expect(screen.getByText("Ana Destaque")).toBeInTheDocument();
    expect(screen.getAllByText("Nota").length).toBeGreaterThan(0);
    expect(screen.getByText("Avaliações & Notas")).toBeInTheDocument();

    // Alterna para Por Frequência
    const botaoFreq = screen.getByRole("button", { name: "Por Frequência" });
    fireEvent.click(botaoFreq);

    expect(screen.getByText("Marcos Falta")).toBeInTheDocument();
    expect(screen.getByText("Julia Presente")).toBeInTheDocument();
    expect(screen.getAllByText("Frequência").length).toBeGreaterThan(0);
    expect(screen.getByText("Presença & Diário")).toBeInTheDocument();
  });
});
