import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  login,
  googleLogin,
  register,
  logout,
  fetchCurrentUser,
  getStoredToken,
  getStoredUser,
} from "./authService";

/**
 * authService.test.js - Testes Unitários do Serviço de Autenticação (Módulo 1)
 */
describe("authService", () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  test("login e googleLogin salvam auth_token e auth_user no localStorage em caso de sucesso", async () => {
    const payloadSucesso = {
      token: "tok-abc",
      user: { id: 10, name: "Ana", role: "aluno" },
    };

    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payloadSucesso,
    });

    const res = await login({ email: "ana@aluno.mg.gov.br", password: "password" });
    expect(res.token).toBe("tok-abc");
    expect(getStoredToken()).toBe("tok-abc");
    expect(getStoredUser()).toEqual(payloadSucesso.user);

    localStorage.clear();
    await googleLogin({ credential: "jwt-google-fake" });
    expect(getStoredToken()).toBe("tok-abc");
  });

  test("login e register lançam erro amigável quando a resposta HTTP não é ok", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Credenciais inválidas." }),
    });

    await expect(login({ email: "x@x.com", password: "err" })).rejects.toThrow(
      "Credenciais inválidas."
    );

    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: "E-mail já cadastrado.",
        errors: { email: ["E-mail já em uso."] },
      }),
    });

    await expect(register({ name: "Ana", email: "x@x.com" })).rejects.toThrow(
      "E-mail já cadastrado."
    );
  });

  test("fetchCurrentUser atualiza auth_user e logout limpa sessão mesmo se a API falhar", async () => {
    localStorage.setItem("auth_token", "tok-valido");
    globalThis.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 7, name: "Prof. Carlos", role: "professor" }),
    });

    const user = await fetchCurrentUser();
    expect(user.name).toBe("Prof. Carlos");
    expect(getStoredUser().role).toBe("professor");

    globalThis.fetch.mockRejectedValue(new Error("Network error"));
    await expect(logout()).rejects.toThrow("Network error");
    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
