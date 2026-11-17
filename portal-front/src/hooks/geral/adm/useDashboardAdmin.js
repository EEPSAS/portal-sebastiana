import { useState, useEffect } from "react";
import { fetchDashboardAdmin } from "../../../services/geralService";

/**
 * useDashboardAdmin.js - Hook do Painel de Gestão do Sistema do Administrador
 *
 * Papel Didático:
 * Consulta o endpoint GET /api/dashboard/admin e disponibiliza os dados analíticos
 * de governança do sistema: total de contas, status, sessões ativas, checklist de saúde
 * da configuração escolar e últimos cadastros realizados.
 */
export function useDashboardAdmin() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;

    fetchDashboardAdmin()
      .then((payload) => {
        if (ativo) {
          setDados(payload);
        }
      })
      .catch((err) => {
        if (ativo) {
          setError(err.message || "Não foi possível carregar os dados administrativos.");
        }
      })
      .finally(() => {
        if (ativo) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  const recarregar = () => {
    setLoading(true);
    setError(null);
    setVersao((v) => v + 1);
  };

  return {
    dados,
    loading,
    error,
    recarregar,
  };
}
