import { api } from "./api";

/**
 * Serviço acadêmico de turmas para o Dashboard do Especialista.
 * Comunica com os endpoints oficiais do Laravel em /api/turmas.
 */

// Busca a listagem de todas as turmas cadastradas na escola
export const fetchTurmas = async ({ signal } = {}) => {
  const response = await api("/turmas", { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar as turmas.");
  }
  return response.json();
};

// Busca o resumo gerencial com KPIs (média geral, taxa de presença e distribuição)
export const fetchTurmaResumo = async (turmaId, { periodo, signal } = {}) => {
  const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : "";
  const response = await api(`/turmas/${turmaId}/resumo-gerencial${query}`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar o resumo da turma.");
  }
  return response.json();
};

// Busca as notas reais registradas para os alunos da turma
export const fetchTurmaNotas = async (turmaId, { periodo, disciplinaId, signal } = {}) => {
  const params = new URLSearchParams();
  if (periodo) params.set("periodo_letivo", periodo);
  if (disciplinaId) params.set("disciplina_id", disciplinaId);
  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await api(`/turmas/${turmaId}/notas${query}`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar as notas da turma.");
  }
  return response.json();
};

// Envia o arquivo CSV de notas/faltas para importação e sincronização
export const importarNotasCSV = async (turmaId, formData, { signal } = {}) => {
  const response = await api(`/turmas/${turmaId}/importar-relatorio`, {
    method: "POST",
    body: formData,
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.errors?.arquivo?.[0] || "Falha ao importar o arquivo CSV.";
    const error = new Error(errorMsg);
    error.details = data?.errors || null;
    throw error;
  }

  return data;
};
