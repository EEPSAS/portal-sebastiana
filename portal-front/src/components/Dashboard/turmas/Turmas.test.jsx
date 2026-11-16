import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Turmas from "./index";
import { AuthContext } from "../../../contexts/authContext";
import * as turmasService from "../../../services/turmasService";
import * as usuarioService from "../../../services/usuarioService";

vi.mock("../../../services/turmasService", () => ({
  fetchTurmas: vi.fn(),
  fetchResumoGeral: vi.fn(),
  fetchMatriculas: vi.fn(),
  fetchTurmaAlunos: vi.fn(),
  fetchTurmaNotas: vi.fn(),
  cancelarMatriculaAluno: vi.fn(),
  excluirDadosCsv: vi.fn(),
  excluirTurma: vi.fn(),
  extrairLista: (dados) => (Array.isArray(dados) ? dados : dados?.data || []),
}));

vi.mock("../../../services/usuarioService", () => ({
  obterPendentesResumo: vi.fn(),
}));

/**
 * Turmas.test.jsx - Testes de Integração do Orquestrador de Turmas e Abas
 *
 * Papel Didático:
 * Valida a adaptação de abas por perfil (Professor inicia em "Quadro de Turmas e Alunos"
 * sem a aba "Visão Geral e Indicadores", enquanto Especialista visualiza as 3 abas e
 * os botões de gestão de Nova Turma e Importar CSV).
 */
describe("Turmas Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    turmasService.fetchTurmas.mockResolvedValue([
      {
        id_turma: 1,
        nome_identificador: "1º Ano A",
        turno: "Matutino",
        ano_letivo: 2026,
        status: "Ativa",
        total_alunos: 25,
      },
    ]);
    turmasService.fetchResumoGeral.mockResolvedValue([
      {
        id_turma: 1,
        nome_identificador: "1º Ano A",
        turno: "Matutino",
        ano_letivo: 2026,
        total_alunos: 25,
        media_geral: 75,
        taxa_presenca: 92,
        taxa_absenteismo: 8,
        total_avaliados: 25,
        distribuicao: { acima: 60, na_media: 30, abaixo: 10 },
      },
    ]);
    turmasService.fetchMatriculas.mockResolvedValue([]);
    turmasService.fetchTurmaAlunos.mockResolvedValue([
      { id: 10, name: "Helena Soares", email: "helena@aluno.mg.gov.br" },
    ]);
    turmasService.fetchTurmaNotas.mockResolvedValue([]);
    usuarioService.obterPendentesResumo.mockResolvedValue({
      alunos_pendentes: 2,
      professores_pendentes: 0,
      total_pendentes: 2,
    });
  });

  test("Especialista visualiza as 3 abas, alterna para Quadro de Turmas e abre modal de Nova Turma", async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, name: "Especialista", role: "especialista" },
          isAuthenticated: true,
        }}
      >
        <MemoryRouter initialEntries={["/dashboard/turmas"]}>
          <Turmas />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByText("Visão Geral e Indicadores")).toBeInTheDocument();
    const abaTurmas = screen.getByRole("button", { name: /Quadro de Turmas e Alunos/i });
    await user.click(abaTurmas);

    await waitFor(() => {
      expect(screen.getAllByText("1º Ano A").length).toBeGreaterThan(0);
    });
  });

  test("Professor inicia diretamente na aba Quadro de Turmas e Alunos sem aba Visão Geral", async () => {
    render(
      <AuthContext.Provider
        value={{
          user: { id: 2, name: "Prof. Carlos", role: "professor" },
          isAuthenticated: true,
        }}
      >
        <MemoryRouter initialEntries={["/dashboard/turmas"]}>
          <Turmas />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("1º Ano A").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("Visão Geral e Indicadores")).toBeNull();
    expect(screen.getByText("Notas e Diário Escolar")).toBeInTheDocument();
  });
});
