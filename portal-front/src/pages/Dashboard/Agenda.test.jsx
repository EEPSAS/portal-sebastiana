import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import AgendaPage from "./Agenda";
import { AuthContext } from "../../contexts/authContext";
import * as useEventosModule from "../../hooks/useEventos";

vi.mock("../../hooks/useEventos", () => ({
  useEventos: vi.fn(),
}));

/**
 * Agenda.test.jsx - Testes de Integração da Página de Agenda e Modais (Módulo 4)
 *
 * Papel Didático:
 * Verifica a sincronização com query string (`?tab=sabados`), a distinção de botões
 * entre Aluno (apenas "Novo Evento") e Especialista ("Cadastro em Massa" + "Novo Evento"),
 * e a abertura dos modais de criação.
 */
describe("AgendaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventosModule.useEventos.mockReturnValue({
      eventos: [
        {
          id: 1,
          title: "Sábado Letivo de Ciências",
          date: "2026-05-16",
          category: "sabados",
          description: "Mostra científica.",
          creatorId: 1,
        },
      ],
      loading: false,
      error: null,
      create: vi.fn().mockResolvedValue({ success: true }),
      createEmMassa: vi.fn().mockResolvedValue({ success: true, data: [] }),
      update: vi.fn(),
      remove: vi.fn(),
      saving: false,
      mutationError: null,
      clearMutationError: vi.fn(),
    });
  });

  test("exibe botão Cadastro em Massa para Especialista e abre o modal ao clicar", async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, name: "Especialista", role: "especialista" },
          isAuthenticated: true,
        }}
      >
        <MemoryRouter initialEntries={["/dashboard/agenda?tab=sabados"]}>
          <AgendaPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Sábado Letivo de Ciências")).toBeInTheDocument();

    const btnEmMassa = screen.getByRole("button", { name: /Cadastro em Massa/i });
    expect(btnEmMassa).toBeInTheDocument();

    await user.click(btnEmMassa);
    expect(
      await screen.findByText(/Cadastro em Massa de Datas Escolares/i)
    ).toBeInTheDocument();
  });

  test("oculta Cadastro em Massa para Aluno mas permite abrir modal de Novo Evento pessoal", async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider
        value={{
          user: { id: 99, name: "Aluno", role: "aluno" },
          isAuthenticated: true,
        }}
      >
        <MemoryRouter initialEntries={["/dashboard/agenda?tab=calendario"]}>
          <AgendaPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.queryByRole("button", { name: /Cadastro em Massa/i })).toBeNull();

    const btnNovoEvento = screen.getByRole("button", { name: /Novo Evento/i });
    await user.click(btnNovoEvento);

    expect(await screen.findByRole("dialog", { name: /Novo Evento/i })).toBeInTheDocument();
  });
});
