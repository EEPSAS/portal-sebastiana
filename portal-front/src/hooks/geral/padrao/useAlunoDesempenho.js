import { useState, useEffect } from "react";
import { useAuth } from "../../useAuth";
import { fetchAlunoDesempenho } from "../../../services/geralService";

/**
 * useAlunoDesempenho.js - Hook Didático para Desempenho e Frequência do Aluno
 *
 * Papel Didático:
 * Centraliza a busca real dos rankings Top 3 de notas e frequências do estudante
 * autenticado, sem recorrer a arrays estáticos fictícios.
 */
export function useAlunoDesempenho(trimestre = null) {
  const { user } = useAuth();
  const alunoId = user?.id ?? null;
  const turmaId = user?.turma_id ?? null;
  const chave = `${alunoId ?? "anon"}:${turmaId ?? "sem-turma"}:${trimestre ?? ""}`;

  const [estado, setEstado] = useState({
    chave: null,
    desempenho: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function carregar() {
      try {
        const data = await fetchAlunoDesempenho(alunoId, turmaId, trimestre);
        if (isMounted) {
          setEstado({ chave, desempenho: data, error: null });
        }
      } catch (err) {
        if (isMounted) {
          setEstado({
            chave,
            desempenho: null,
            error: err.message || "Erro ao carregar dados de desempenho",
          });
        }
      }
    }

    carregar();

    return () => {
      isMounted = false;
    };
  }, [chave, alunoId, turmaId, trimestre]);

  const loading = estado.chave !== chave;

  return {
    desempenho: estado.desempenho,
    loading,
    error: loading ? null : estado.error,
  };
}
