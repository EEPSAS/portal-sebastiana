import { api } from "./api";

/**
 * professoresService.js - Serviço de Gestão de Professores (Módulo 5.1)
 *
 * Papel Didático:
 * Centraliza as operações de leitura, confirmação e vinculação docente via API RESTful (/api/professores/*),
 * mantendo conformidade 1:1 com as especificações do apiContract.md.
 */

/**
 * Lista todos os professores cadastrados na instituição com suporte a filtros.
 *
 * @param {Object} params - Parâmetros opcionais: { status: 'pendente'|'confirmado'|'rejeitado', q: string }
 * @returns {Promise<{ data: Array, meta: { total: number, pendentes_count: number } }>}
 */
export const listarProfessores = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.q) query.append("q", params.q);

  const url = query.toString() ? `/professores?${query.toString()}` : "/professores";
  const response = await api(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao carregar a lista de professores.");
  }

  return data;
};

/**
 * Detalha as informações e vínculos de um professor específico.
 *
 * @param {number} professorId
 */
export const obterProfessor = async (professorId) => {
  const response = await api(`/professores/${professorId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao consultar dados do professor.");
  }

  return data;
};

/**
 * Confirma o pertencimento do professor à Escola Sebastiana, vinculando-o às disciplinas selecionadas (Item 2.3.2).
 *
 * @param {number} professorId
 * @param {Array<number>} disciplinaIds
 */
export const confirmarProfessor = async (professorId, disciplinaIds = []) => {
  const body = Array.isArray(disciplinaIds) && disciplinaIds.length > 0
    ? { disciplina_ids: disciplinaIds.map(Number) }
    : undefined;

  const response = await api(`/professores/${professorId}/confirmar`, {
    method: "PATCH",
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao confirmar professor na escola.");
  }

  return data;
};

/**
 * Recusa/rejeita o acesso institucional do professor.
 *
 * @param {number} professorId
 */
export const recusarProfessor = async (professorId) => {
  const response = await api(`/professores/${professorId}/recusar`, {
    method: "PATCH",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao recusar acesso do professor.");
  }

  return data;
};

/**
 * Vincula o professor diretamente a uma disciplina curricular.
 *
 * @param {number} professorId
 * @param {number} disciplinaId
 */
export const vincularDisciplina = async (professorId, disciplinaId) => {
  const response = await api(`/professores/${professorId}/vincular-disciplina`, {
    method: "POST",
    body: { disciplina_id: disciplinaId },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao vincular disciplina ao professor.");
  }

  return data;
};

/**
 * Desvincula o professor de uma disciplina curricular.
 *
 * @param {number} professorId
 * @param {number} disciplinaId
 */
export const desvincularDisciplina = async (professorId, disciplinaId) => {
  const response = await api(`/professores/${professorId}/desvincular-disciplina/${disciplinaId}`, {
    method: "DELETE",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao desvincular disciplina do professor.");
  }

  return data;
};

/**
 * Lista todas as disciplinas curriculares cadastradas na escola.
 */
export const listarDisciplinas = async () => {
  const response = await api("/disciplinas");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao carregar catálogo de disciplinas.");
  }

  // Suporta retorno envelopado em { data: [...] } ou array direto
  return Array.isArray(data) ? data : data.data || [];
};

export const professoresService = {
  listarProfessores,
  obterProfessor,
  confirmarProfessor,
  recusarProfessor,
  listarDisciplinas,
  vincularDisciplina,
  desvincularDisciplina,
};
