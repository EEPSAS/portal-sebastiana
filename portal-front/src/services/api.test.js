import { describe, test, expect, vi, beforeEach } from "vitest";
import { api, clearApiCache } from "./api";

/**
 * api.test.js - Testes Unitários do Cliente HTTP Nativo com Cache e SWR
 *
 * Papel Didático:
 * Garante que o wrapper `api()`:
 * 1. Injete automaticamente o header `Authorization: Bearer <token>` quando autenticado;
 * 2. Serialize objetos JSON sem duplicar serialização de strings ou `FormData`;
 * 3. Limpe `auth_token` e `auth_user` do `localStorage` ao receber `401 Unauthorized`;
 * 4. Guarde respostas GET em memória e entregue cópias em 0ms;
 * 5. Invalide o cache correspondente ao realizar mutações (POST, PUT, DELETE);
 * 6. Deduplique chamadas simultâneas em voo (In-Flight Requests).
 */
describe("api (Fetch Wrapper com Cache SWR)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiCache();
    globalThis.fetch = vi.fn();
  });

  test("injeta Authorization Bearer quando auth_token existe e serializa body JSON", async () => {
    localStorage.setItem("auth_token", "token-sanctum-123");
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

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
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
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
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "Não autenticado." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    await api("/user");

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  test("retorna dados em cache em chamadas GET subsequentes sem chamar fetch novamente", async () => {
    const payload = [{ id: 1, titulo: "Feira de Ciências" }];
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    // 1ª chamada: vai para a rede
    const resp1 = await api("/eventos");
    const data1 = await resp1.json();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(data1).toEqual(payload);

    // 2ª chamada imediata: deve vir do cache em 0ms
    const resp2 = await api("/eventos");
    const data2 = await resp2.json();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1); // Não chamou fetch novamente
    expect(data2).toEqual(payload);
  });

  test("invalida o cache após mutação POST/PUT/DELETE no mesmo domínio", async () => {
    const payloadInicial = [{ id: 1, nome: "1º Ano A" }];
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify(payloadInicial), { status: 200 })
    );

    // Popula o cache
    await api("/turmas");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Mutação: cria uma nova turma
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 2, nome: "1º Ano B" }), { status: 201 })
    );
    await api("/turmas", {
      method: "POST",
      body: { nome_identificador: "1º Ano B" },
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    // Próximo GET /turmas deve ir para a rede novamente porque o cache foi invalidado
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify([...payloadInicial, { id: 2, nome: "1º Ano B" }]), { status: 200 })
    );
    await api("/turmas");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  test("clearApiCache() limpa todos os dados em memória", async () => {
    globalThis.fetch.mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 })
    );

    await api("/noticias");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Limpa o cache
    clearApiCache();

    // Próxima chamada deve buscar da rede
    await api("/noticias");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  test("deduplica requisições concorrentes em voo para o mesmo endpoint", async () => {
    let resolver;
    const pendingPromise = new Promise((resolve) => {
      resolver = resolve;
    });

    globalThis.fetch.mockImplementation(() => pendingPromise);

    // Dispara 2 requisições ao mesmo tempo antes da primeira responder
    const req1 = api("/disciplinas");
    const req2 = api("/disciplinas");

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Resolve a resposta
    resolver(
      new Response(JSON.stringify([{ id: 1, nome: "Matemática" }]), { status: 200 })
    );

    const [resp1, resp2] = await Promise.all([req1, req2]);
    const data1 = await resp1.json();
    const data2 = await resp2.json();

    expect(data1).toEqual([{ id: 1, nome: "Matemática" }]);
    expect(data2).toEqual([{ id: 1, nome: "Matemática" }]);
  });
});
