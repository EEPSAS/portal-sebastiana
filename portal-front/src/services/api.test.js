import { describe, test, expect, vi, beforeEach } from "vitest";
import { api } from "./api";

/**
 * api.test.js - Testes Unitários do Cliente HTTP Nativo (Fetch Wrapper)
 *
 * Papel Didático:
 * Garante que o wrapper `api()`:
 * 1. Injete automaticamente o header `Authorization: Bearer <token>` quando autenticado;
 * 2. Serialize objetos JSON sem duplicar serialização de strings ou `FormData`;
 * 3. Limpe `auth_token` e `auth_user` do `localStorage` ao receber `401 Unauthorized`.
 */
describe("api (Fetch Wrapper)", () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  test("injeta Authorization Bearer quando auth_token existe e serializa body JSON", async () => {
    localStorage.setItem("auth_token", "token-sanctum-123");
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    await api("/turmas", {
      method: "POST",
      body: { nome_identificador: "1º Ano A" },
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, config] = globalThis.fetch.mock.calls[0];
    expect(config.headers.Authorization).toBe("Bearer token-sanctum-123");
    expect(config.headers["Content-Type"]).toBe("application/json");
    expect(config.body).toBe(JSON.stringify({ nome_identificador: "1º Ano A" }));
  });

  test("omite Content-Type manual quando o body é FormData para preservar o boundary", async () => {
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });
    const formData = new FormData();
    formData.append("periodo_letivo", "1º Trimestre");

    await api("/turmas/1/importar-relatorio", {
      method: "POST",
      body: formData,
    });

    const [, config] = globalThis.fetch.mock.calls[0];
    expect(config.headers["Content-Type"]).toBeUndefined();
    expect(config.body).toBe(formData);
  });

  test("limpa auth_token e auth_user do localStorage quando recebe 401 Unauthorized", async () => {
    localStorage.setItem("auth_token", "token-expirado");
    localStorage.setItem("auth_user", JSON.stringify({ id: 1, name: "Aluno" }));
    globalThis.fetch.mockResolvedValue({ status: 401, ok: false });

    await api("/user");

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });
});
