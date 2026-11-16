import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import Login from "./Login";
import { AuthContext } from "../../contexts/authContext";

/**
 * Login.test.jsx - Testes de Integração da Tela de Login
 */
describe("Login Page", () => {
  test("envia credenciais válidas e redireciona para /dashboard", async () => {
    const loginMock = vi.fn().mockResolvedValue({ token: "123" });
    const user = userEvent.setup();

    render(
      <AuthContext.Provider value={{ login: loginMock, loginWithGoogle: vi.fn() }}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<div>Área Logada</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/E-mail/i), "admin@sebastiana.edu.br");
    await user.type(screen.getByLabelText(/Senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "admin@sebastiana.edu.br",
        password: "password123",
      });
      expect(screen.getByText("Área Logada")).toBeInTheDocument();
    });
  });

  test("exibe alerta de erro quando o login falha", async () => {
    const loginMock = vi
      .fn()
      .mockRejectedValue(new Error("Credenciais inválidas. Verifique seu e-mail e senha."));
    const user = userEvent.setup();

    render(
      <AuthContext.Provider value={{ login: loginMock, loginWithGoogle: vi.fn() }}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/E-mail/i), "errado@sebastiana.edu.br");
    await user.type(screen.getByLabelText(/Senha/i), "senhaerrada");
    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    expect(
      await screen.findByText(/Credenciais inválidas\. Verifique seu e-mail e senha\./i)
    ).toBeInTheDocument();
  });
});
