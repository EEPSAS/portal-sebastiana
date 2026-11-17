import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../contexts/authContext";

/**
 * ProtectedRoute.test.jsx - Testes de Guarda de Rotas e RBAC (React Router)
 *
 * Papel Didático:
 * Verifica os 4 estados do ProtectedRoute:
 * 1. Exibição do spinner durante carregamento inicial;
 * 2. Redirecionamento de visitante anônimo para o Portal Público (`/`);
 * 3. Redirecionamento de usuário com `status_confirmacao === 'pendente'` para `/dashboard/espera`;
 * 4. Controle de acesso por perfil (`allowedRoles`) redirecionando rotas não autorizadas para o Portal Público (`/`).
 */
const renderComRota = (authValue, initialEntry = "/dashboard/usuarios", allowedRoles) =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/" element={<div>Portal Público</div>} />
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route path="/dashboard/espera" element={<div>Sala de Espera</div>} />
          <Route path="/dashboard/geral" element={<div>Painel Geral</div>} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/dashboard/usuarios" element={<div>Gestão de Usuários</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("ProtectedRoute", () => {
  test("exibe indicador de carregamento enquanto loading é true", () => {
    renderComRota({ user: null, isAuthenticated: false, loading: true });
    expect(screen.getByText(/Verificando credenciais de acesso/i)).toBeInTheDocument();
  });

  test("redireciona visitante deslogado para o portal público (/)", () => {
    renderComRota({ user: null, isAuthenticated: false, loading: false });
    expect(screen.getByText("Portal Público")).toBeInTheDocument();
  });

  test("redireciona usuário com aprovação pendente para /dashboard/espera", () => {
    renderComRota({
      user: { id: 2, role: "professor", status_confirmacao: "pendente" },
      isAuthenticated: true,
      loading: false,
    });
    expect(screen.getByText("Sala de Espera")).toBeInTheDocument();
  });

  test("bloqueia perfil não incluído em allowedRoles redirecionando para o portal público e libera perfil autorizado", () => {
    const { unmount } = renderComRota(
      {
        user: { id: 3, role: "aluno", status_confirmacao: "confirmado" },
        isAuthenticated: true,
        loading: false,
      },
      "/dashboard/usuarios",
      ["adm"]
    );

    expect(screen.getByText("Portal Público")).toBeInTheDocument();
    unmount();

    renderComRota(
      {
        user: { id: 1, role: "adm", status_confirmacao: "confirmado" },
        isAuthenticated: true,
        loading: false,
      },
      "/dashboard/usuarios",
      ["adm"]
    );

    expect(screen.getByText("Gestão de Usuários")).toBeInTheDocument();
  });
});
