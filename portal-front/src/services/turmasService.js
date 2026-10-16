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

// Busca o resumo consolidado de todas as turmas para gráficos e KPIs globais
export const fetchResumoGeral = async ({ signal } = {}) => {
  const response = await api("/turmas/resumo-geral", { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar os indicadores das turmas.");
  }
  return response.json();
};

// Cria uma nova turma escolar
export const criarTurma = async (dados, { signal } = {}) => {
  const response = await api("/turmas", {
    method: "POST",
    body: dados,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível cadastrar a turma.");
  }
  return data;
};

// Atualiza dados cadastrais de uma turma existente
export const atualizarTurma = async (turmaId, dados, { signal } = {}) => {
  const response = await api(`/turmas/${turmaId}`, {
    method: "PUT",
    body: dados,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível atualizar a turma.");
  }
  return data;
};

// Remove uma turma escolar (bloqueado se houver alunos ativos)
export const excluirTurma = async (turmaId, { signal } = {}) => {
  const response = await api(`/turmas/${turmaId}`, {
    method: "DELETE",
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Não foi possível excluir a turma.");
  }
  return true;
};

// Busca a relação nominal de todas as matrículas ativas da escola
export const fetchMatriculas = async ({ signal } = {}) => {
  const response = await api("/matriculas", { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar as matrículas.");
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

// Busca as notas reais registradas para os alunos da turma (com suporte a filtros opcionais)
export const fetchTurmaNotas = async (turmaId, { periodo, disciplinaId, alunoId, signal } = {}) => {
  const params = new URLSearchParams();
  if (periodo) params.set("periodo_letivo", periodo);
  if (disciplinaId) params.set("disciplina_id", disciplinaId);
  if (alunoId) params.set("aluno_id", alunoId);
  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await api(`/turmas/${turmaId}/notas${query}`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar as notas da turma.");
  }
  return response.json();
};

// Exclui notas e frequências importadas via CSV para a turma e período selecionados
export const excluirDadosCsv = async (turmaId, { periodo, signal } = {}) => {
  const params = new URLSearchParams();
  if (periodo) params.set("periodo_letivo", periodo);
  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await api(`/turmas/${turmaId}/dados-csv${query}`, {
    method: "DELETE",
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível excluir os dados do diário escolar.");
  }

  return data;
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

// Busca os alunos matriculados na turma com dados de status e data de matrícula
export const fetchTurmaAlunos = async (turmaId, { signal } = {}) => {
  const response = await api(`/turmas/${turmaId}/alunos`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar os alunos da turma.");
  }
  return response.json();
};

// Busca os alunos cadastrados no sistema elegíveis para matrícula na turma
export const fetchAlunosDisponiveis = async (turmaId, { busca, signal } = {}) => {
  const query = busca ? `?q=${encodeURIComponent(busca)}` : "";
  const response = await api(`/turmas/${turmaId}/alunos-disponiveis${query}`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível buscar alunos disponíveis.");
  }
  return response.json();
};

// Vincula e matricula um aluno na turma selecionada
export const vincularAlunoTurma = async ({ turmaId, usuarioId, dataMatricula }, { signal } = {}) => {
  const response = await api("/matriculas", {
    method: "POST",
    body: {
      turma_id: turmaId,
      usuario_id: usuarioId,
      data_matricula: dataMatricula || undefined,
    },
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível vincular o aluno à turma.");
  }

  return data;
};

// Homologa e confirma a matrícula do estudante vindo da integração com a API do Google Workspace
export const confirmarMatriculaAluno = vincularAlunoTurma;

// Cancela ou transfere a matrícula do aluno
export const cancelarMatriculaAluno = async (matriculaId, { status = "Evadido", signal } = {}) => {
  const response = await api(`/matriculas/${matriculaId}/cancelar`, {
    method: "PATCH",
    body: { status_matricula: status },
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível atualizar a matrícula.");
  }

  return data;
};

