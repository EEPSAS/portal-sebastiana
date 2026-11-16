import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * setup.js - Configuração Global do Ambiente de Testes (Vitest + JSDOM)
 *
 * Papel Didático:
 * - Registra matchers semânticos do @testing-library/jest-dom (ex: toBeInTheDocument, toHaveValue);
 * - Limpa a árvore DOM após cada teste e fornece polyfills leves de browser APIs
 *   (matchMedia, ResizeObserver) utilizadas por componentes responsivos e Recharts.
 */
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
