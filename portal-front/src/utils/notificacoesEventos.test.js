import { describe, test, expect, vi } from "vitest";
import {
  EVENTO_PENDENCIAS_ATUALIZADAS,
  notificarAtualizacaoPendencias,
} from "./notificacoesEventos";

/**
 * notificacoesEventos.test.js - Testes do Barramento Nativo de Eventos (CustomEvent)
 */
describe("notificacoesEventos", () => {
  test("notificarAtualizacaoPendencias dispara CustomEvent global em window", () => {
    const listener = vi.fn();
    window.addEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, listener);

    notificarAtualizacaoPendencias();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, listener);
  });
});
