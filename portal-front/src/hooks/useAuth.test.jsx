import { describe, test, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { AuthContext } from "../contexts/authContext";

/**
 * useAuth.test.jsx - Testes Unitários do Hook de Autenticação
 */
describe("useAuth", () => {
  test("lança erro didático quando utilizado fora de um AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth deve ser utilizado dentro de um componente <AuthProvider>."
    );
  });

  test("retorna o objeto do contexto quando envolvido por AuthContext.Provider", () => {
    const valorMock = {
      user: { id: 1, name: "Administrador", role: "adm" },
      isAuthenticated: true,
      loading: false,
    };

    const wrapper = ({ children }) => (
      <AuthContext.Provider value={valorMock}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.role).toBe("adm");
  });
});
