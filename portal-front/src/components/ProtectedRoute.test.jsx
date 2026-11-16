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
 * 2. Redirecionamento de visitante anônimo para `/login`;
 * 3. Redirecionamento de usuário com `status_confirmacao === 'pendente'` para `/dashboard/espera`;
 * 4. Controle de acesso por perfil (`allowedRoles`) redirecionando perfis não autorizados para `/dashboard/geral`.
 */
const renderComRota = (authValue, initialEntry = "/dashboard/usuarios", allowedRoles) =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
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

  test("redireciona visitante deslogado para /login", () => {
    renderComRota({ user: null, isAuthenticated: false, loading: false });
    expect(screen.getByText("Tela de Login")).toBeInTheDocument();
  });

  test("redireciona usuário com aprovação pendente para /dashboard/espera", () => {
    renderComRota({
      user: { id: 2, role: "professor", status_confirmacao: "pendente" },
      isAuthenticated: true,
      loading: false,
    });
    expect(screen.getByText("Sala de Espera")).toBeInTheDocument();
  });

  test("bloqueia perfil não incluído em allowedRoles e libera perfil autorizado", () => {
    const { unmount } = renderComRota(
      {
        user: { id: 3, role: "aluno", status_confirmacao: "confirmado" },
        isAuthenticated: true,
        loading: false,
      },
      "/dashboard/usuarios",
      ["adm"]
    );

    expect(screen.getByText("Painel Geral")).toBeInTheDocument();
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
