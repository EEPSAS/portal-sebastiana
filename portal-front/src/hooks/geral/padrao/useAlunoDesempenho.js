import { useState, useEffect } from "react";
import { fetchAlunoDesempenho } from "../../../services/geralService";

/**
 * useAlunoDesempenho.js - Hook Didático para Desempenho e Frequência do Aluno
 *
 * Papel Didático:
 * Centraliza o estado assíncrono (carregando, erro e dados) para o painel de Desempenho
 * por Disciplina e Frequência do estudante.
 */
export function useAlunoDesempenho() {
  const [desempenho, setDesempenho] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function carregar() {
      try {
        setLoading(true);
        const data = await fetchAlunoDesempenho();
        if (isMounted) setDesempenho(data);
      } catch (err) {
        if (isMounted) setError(err.message || "Erro ao carregar dados de desempenho");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    carregar();

    return () => {
      isMounted = false;
    };
  }, []);

  return { desempenho, loading, error };
}
