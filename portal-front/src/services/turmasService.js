import { api } from "./api";
import {
  ImportarRelatorioInputSchema,
  ListaAlunosTurmaSchema,
  ListaNotasDiarioSchema,
  ListaTurmaResumoSchema,
  ListaTurmasSchema,
  RelatorioImportadoSchema,
  SalvarTurmaInputSchema,
  TurmaSchema,
  validarContratoZod,
  validarFormularioZod,
} from "../utils/academicoSchemas";

/**
 * Serviço acadêmico de turmas para o Dashboard do Especialista.
 * Comunica com os endpoints oficiais do Laravel em /api/turmas,
 * forçando revalidação estrita de contratos com Zod.
 */

// Utilitário enxuto para extrair listas independente de estarem envelopadas em { data: [...] }
export const extrairLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

// Busca a listagem de todas as turmas cadastradas na escola com revalidação estrita Zod
export const fetchTurmas = async ({ signal } = {}) => {
  const response = await api("/turmas", { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar as turmas.");
  }
  const raw = await response.json();
  return validarContratoZod(ListaTurmasSchema, extrairLista(raw), "GET /turmas");
};

// Busca o resumo consolidado de todas as turmas para gráficos e KPIs globais com revalidação Zod
export const fetchResumoGeral = async ({ signal } = {}) => {
  const response = await api("/turmas/resumo-geral", { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar os indicadores das turmas.");
  }
  const raw = await response.json();
  return validarContratoZod(ListaTurmaResumoSchema, extrairLista(raw), "GET /turmas/resumo-geral");
};

// Cria uma nova turma escolar validando payload de entrada e resposta com Zod
export const criarTurma = async (dados, { signal } = {}) => {
  const checkEntrada = validarFormularioZod(SalvarTurmaInputSchema, dados);
  if (!checkEntrada.valido) {
    throw new Error(checkEntrada.mensagem);
  }

  const response = await api("/turmas", {
    method: "POST",
    body: checkEntrada.dados,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível cadastrar a turma.");
  }
  return validarContratoZod(TurmaSchema, data?.data || data, "POST /turmas");
};

// Atualiza dados cadastrais de uma turma existente validando entrada parcial e resposta com Zod
export const atualizarTurma = async (turmaId, dados, { signal } = {}) => {
  const checkEntrada = validarFormularioZod(SalvarTurmaInputSchema.partial(), dados);
  if (!checkEntrada.valido) {
    throw new Error(checkEntrada.mensagem);
  }

  const response = await api(`/turmas/${turmaId}`, {
    method: "PUT",
    body: checkEntrada.dados,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível atualizar a turma.");
  }
  return validarContratoZod(TurmaSchema, data?.data || data, "PUT /turmas/:id");
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

// Busca as notas reais registradas para os alunos da turma (com suporte a filtros opcionais) e valida via Zod
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
  const raw = await response.json();
  return validarContratoZod(ListaNotasDiarioSchema, extrairLista(raw), "GET /turmas/:id/notas");
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

// Envia o arquivo CSV de notas/faltas para importação e sincronização com dupla revalidação Zod (antes e depois)
export const importarNotasCSV = async (turmaId, formData, { signal } = {}) => {
  // 1. Extrai e revalida os dados e mapeamentos do FormData ANTES da requisição HTTP
  if (formData instanceof FormData) {
    const parseJsonSeguro = (valor) => {
      if (!valor || typeof valor !== "string") return undefined;
      try {
        return JSON.parse(valor);
      } catch {
        return undefined;
      }
    };

    const payloadEntrada = {
      turmaId,
      arquivo: formData.get("arquivo") || formData.get("planilha"),
      periodo_letivo: formData.get("periodo_letivo") || null,
      data_aula: formData.get("data_aula") || null,
      decisao_divergencias: formData.get("decisao_divergencias") || null,
      mapeamentos_alunos: parseJsonSeguro(formData.get("mapeamentos_alunos")),
      mapeamentos_disciplinas: parseJsonSeguro(formData.get("mapeamentos_disciplinas")),
    };

    const checkEntrada = validarFormularioZod(ImportarRelatorioInputSchema, payloadEntrada);
    if (!checkEntrada.valido) {
      throw new Error(checkEntrada.mensagem);
    }
  }

  const response = await api(`/turmas/${turmaId}/importar-relatorio`, {
    method: "POST",
    body: formData,
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const primeiraMsgValidacao = data?.errors
      ? Object.values(data.errors).flat()[0]
      : null;
    const errorMsg =
      primeiraMsgValidacao || data?.message || "Falha ao importar o arquivo CSV.";
    const error = new Error(errorMsg);
    error.details = data?.errors || null;
    throw error;
  }

  // 2. Revalida estritamente o envelope de saída (homônimos, divergências, disciplinas e notas sincronizadas)
  return validarContratoZod(
    RelatorioImportadoSchema,
    data?.data && data?.status === undefined ? data.data : data,
    "POST /turmas/:id/importar-relatorio"
  );
};

// Busca os alunos matriculados na turma com dados de status e data de matrícula validados por Zod
export const fetchTurmaAlunos = async (turmaId, { signal } = {}) => {
  const response = await api(`/turmas/${turmaId}/alunos`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível carregar os alunos da turma.");
  }
  const data = await response.json().catch(() => null);
  return validarContratoZod(ListaAlunosTurmaSchema, extrairLista(data), "GET /turmas/:id/alunos");
};

// Busca os alunos cadastrados no sistema elegíveis para matrícula na turma
export const fetchAlunosDisponiveis = async (turmaId, { busca, signal } = {}) => {
  const query = busca ? `?q=${encodeURIComponent(busca)}` : "";
  const response = await api(`/turmas/${turmaId}/alunos-disponiveis${query}`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Não foi possível buscar alunos disponíveis.");
  }
  const data = await response.json().catch(() => null);
  return extrairLista(data);
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

// Aliases semânticos em português para paridade 1:1 com apiContract.md
export const obterResumoGeral = fetchResumoGeral;
export const listarTurmas = fetchTurmas;
export const listarAlunosTurma = fetchTurmaAlunos;
export const listarAlunosDisponiveis = fetchAlunosDisponiveis;
export const listarMatriculas = fetchMatriculas;
export const vincularAluno = vincularAlunoTurma;
export const cancelarMatricula = cancelarMatriculaAluno;
export const importarRelatorioCSV = importarNotasCSV;
export const listarNotasTurma = fetchTurmaNotas;

export const turmasService = {
  obterResumoGeral,
  listarTurmas,
  criarTurma,
  atualizarTurma,
  excluirTurma,
  listarAlunosTurma,
  listarAlunosDisponiveis,
  listarMatriculas,
  vincularAluno,
  cancelarMatricula,
  importarRelatorioCSV,
  excluirDadosCsv,
  listarNotasTurma,
};
