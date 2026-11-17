import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PainelPeriodoGeral from "./PainelPeriodoGeral";

describe("PainelPeriodoGeral", () => {
  it("renderiza opções de pílulas e dispara evento de seleção", () => {
    const onSelecionarMock = vi.fn();
    const opcoes = [
      { valor: "todos", rotulo: "Consolidado Geral" },
      { valor: "1º Trimestre", rotulo: "1º Trimestre (30 pts)" },
    ];

    render(
      <PainelPeriodoGeral
        rotulo="Etapa Avaliativa:"
        opcoes={opcoes}
        valorSelecionado="todos"
        onSelecionar={onSelecionarMock}
        anoLetivo={2026}
      />
    );

    expect(screen.getByText("Etapa Avaliativa:")).toBeInTheDocument();
    expect(screen.getByText("Ano Letivo 2026")).toBeInTheDocument();

    const botaoTodos = screen.getByRole("button", { name: "Consolidado Geral" });
    expect(botaoTodos).toHaveAttribute("aria-pressed", "true");
    expect(botaoTodos).toHaveClass("is-active");

    const botaoEtapa = screen.getByRole("button", { name: "1º Trimestre (30 pts)" });
    expect(botaoEtapa).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(botaoEtapa);
    expect(onSelecionarMock).toHaveBeenCalledWith("1º Trimestre");
  });
});
