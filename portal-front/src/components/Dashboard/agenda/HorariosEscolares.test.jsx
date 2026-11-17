import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HorariosEscolares from "./HorariosEscolares";
import { AuthContext } from "../../../contexts/authContext";
import * as horariosService from "../../../services/horariosService";

vi.mock("../../../services/horariosService", () => ({
  listarHorarios: vi.fn(),
  gerarHorario: vi.fn(),
  moverAula: vi.fn(),
}));

/**
 * HorariosEscolares.test.jsx - Testes de Integração da Grade Semanal de Horários
 *
 * Papel Didático:
 * Verifica a renderização das 5 colunas da semana, a exibição das aulas com o
 * formato "Disciplina - Ciclo" e o acionamento de geração de grade pelo Especialista.
 */
describe("HorariosEscolares", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renderiza grade semanal com aulas formatadas e botão Gerar para Especialista", async () => {
    horariosService.listarHorarios.mockResolvedValue([
      {
        turma: {
          id_turma: 1,
          nome_identificador: "1º Ano A",
          ano_letivo: 2026,
          ciclo_nome: "1º Ano",
        },
        horario: {
          id: 10,
          status: "concluido",
          aulas: [
            {
              id: 100,
              dia_semana: 1,
              aula_numero: 1,
              disciplina: {
                id_disciplina: 5,
                nome: "Matemática",
                aulas_semanais: 5,
                carga_horaria_anual: 200,
                ciclo_nome: "1º Ano",
              },
              professor: { id: 2, name: "Prof. Carlos" },
            },
          ],
        },
      },
    ]);

    let acoesRegistradas = null;
    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, name: "Especialista", role: "especialista" },
          isAuthenticated: true,
        }}
      >
        <HorariosEscolares
          onRegistrarAcoes={(acoes) => {
            acoesRegistradas = acoes;
          }}
        />
      </AuthContext.Provider>
    );

    expect(await screen.findByText("Matemática - 1º Ano")).toBeInTheDocument();
    expect(screen.getByText("Prof. Carlos")).toBeInTheDocument();
    expect(screen.getByText("Segunda-feira")).toBeInTheDocument();
    await waitFor(() => {
      expect(acoesRegistradas).not.toBeNull();
    });
  });

  test("permite ao Especialista acionar gerarHorario e exibe erro amigável caso falhe", async () => {
    horariosService.listarHorarios.mockResolvedValue([
      {
        turma: { id_turma: 1, nome_identificador: "1º Ano A", ano_letivo: 2026 },
        horario: null,
      },
    ]);
    horariosService.gerarHorario.mockRejectedValue(
      new Error("A turma precisa somar exatamente 30 aulas semanais.")
    );

    const WrapperComAcoes = () => {
      const [acoes, setAcoes] = React.useState(null);
      return (
        <div>
          <div data-testid="acoes-header">{acoes}</div>
          <HorariosEscolares onRegistrarAcoes={setAcoes} />
        </div>
      );
    };
    const React = await import("react");
    const user = userEvent.setup();

    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, name: "Especialista", role: "especialista" },
          isAuthenticated: true,
        }}
      >
        <WrapperComAcoes />
      </AuthContext.Provider>
    );

    const botaoGerar = await screen.findByRole("button", { name: /Gerar/i });
    await user.click(botaoGerar);

    await waitFor(() => {
      expect(horariosService.gerarHorario).toHaveBeenCalledWith("1");
      expect(
        screen.getByText(/A turma precisa somar exatamente 30 aulas semanais\./i)
      ).toBeInTheDocument();
    });
  });
});
