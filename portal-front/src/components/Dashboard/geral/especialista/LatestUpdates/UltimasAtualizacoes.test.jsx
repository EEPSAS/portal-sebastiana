import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LatestUpdates from "./UltimasAtualizacoes";
import * as geralService from "../../../../../services/geralService";

describe("LatestUpdates Component", () => {
  const updatesMock = [
    {
      id: "ev-1",
      tipo: "notificacao",
      categoria: "manual",
      categoria_rotulo: "Comunicação Escolar",
      texto: "Prof. Carlos: Prova bimestral",
      criador_nome: "Prof. Carlos",
      destinatario_nome: "João Silva",
      tempoAtras: "há 10 minutos",
    },
    {
      id: "ev-2",
      tipo: "notificacao",
      categoria: "biblioteca",
      categoria_rotulo: "Biblioteca",
      texto: "Biblioteca: Livro atrasado",
      criador_nome: "Dona Nana",
      destinatario_nome: "Maria Oliveira",
      tempoAtras: "há 1 hora",
    },
  ];

  it("renderiza as notificações iniciais do preload leve e o seletor com 5 últimas", () => {
    render(<LatestUpdates updates={updatesMock} />);

    expect(screen.getByText("Últimas Notificações")).toBeInTheDocument();
    expect(screen.getByText("Prof. Carlos: Prova bimestral")).toBeInTheDocument();
    expect(screen.getByText("Biblioteca: Livro atrasado")).toBeInTheDocument();

    const select = screen.getByLabelText("Selecionar quantidade de notificações para carregar");
    expect(select).toHaveValue("5");
  });

  it("dispara fetch sob demanda ao alterar a quantidade para 25 ou 50", async () => {
    const fetchSpy = vi.spyOn(geralService, "fetchDashboardNotificacoes").mockResolvedValueOnce([
      {
        id: "ev-3",
        tipo: "notificacao",
        categoria: "sistema",
        categoria_rotulo: "Aviso do Sistema",
        texto: "Sistema: Manutenção programada",
        tempoAtras: "há 2 horas",
      },
    ]);

    render(<LatestUpdates updates={updatesMock} />);

    const select = screen.getByLabelText("Selecionar quantidade de notificações para carregar");
    fireEvent.change(select, { target: { value: "25" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          limite: 25,
        })
      );
    });

    expect(await screen.findByText("Sistema: Manutenção programada")).toBeInTheDocument();
  });

  it("permite abrir o painel de filtros e aplicar busca por remetente, destinatário e categoria", async () => {
    const fetchSpy = vi.spyOn(geralService, "fetchDashboardNotificacoes").mockResolvedValueOnce([
      {
        id: "ev-4",
        tipo: "notificacao",
        categoria: "manual",
        categoria_rotulo: "Comunicação Escolar",
        texto: "Prof. Carlos: Entrega adiada",
        criador_nome: "Prof. Carlos",
        destinatario_nome: "Lucas Mendes",
        tempoAtras: "há 3 horas",
      },
    ]);

    render(<LatestUpdates updates={updatesMock} />);

    // Clica no botão de filtros
    const btnFiltros = screen.getByTitle("Filtrar por destinatário, remetente ou categoria");
    fireEvent.click(btnFiltros);

    // Preenche os campos
    const inputRemetente = screen.getByLabelText("Quem enviou (Remetente)");
    fireEvent.change(inputRemetente, { target: { value: "Carlos" } });

    const btnBuscar = screen.getByRole("button", { name: "Aplicar Filtros" });
    fireEvent.click(btnBuscar);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          remetente: "Carlos",
        })
      );
    });

    expect(await screen.findByText("Prof. Carlos: Entrega adiada")).toBeInTheDocument();
  });
});
