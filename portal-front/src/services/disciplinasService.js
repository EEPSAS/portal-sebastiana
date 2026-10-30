import { api } from "./api";

/**
 * disciplinasService.js - Serviço de Gestão de Disciplinas e Ciclos Escolares (Diretriz 3)
 *
 * Papel Didático:
 * Centraliza as chamadas à API RESTful para os Ciclos Escolares (/api/ciclos)
 * e para o catálogo de Disciplinas (/api/disciplinas), atendendo tanto a visão
 * gerencial do Especialista/Admin quanto a visão consultiva do Aluno e Professor.
 */

/**
 * Lista todos os Ciclos Escolares como array para seletores (ex: ModalTurma).
 */
export const listarCiclos = async ({ signal } = {}) => {
  const response = await api("/ciclos", { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar os ciclos e disciplinas.");
  }

  return Array.isArray(data) ? data : data?.data || data?.ciclos || [];
};

/**
 * Lista os Ciclos Escolares com suas disciplinas agrupadas, disciplinas sem ciclo e dados da turma ativa do aluno.
 */
export const listarDisciplinasPorCiclo = async ({ signal } = {}) => {
  const response = await api("/ciclos", { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar os ciclos e disciplinas.");
  }

  const ciclos = Array.isArray(data) ? data : data?.data || data?.ciclos || [];
  const disciplinasSemCiclo = data?.disciplinas_sem_ciclo || [];
  const todasDisciplinas = [
    ...ciclos.flatMap((c) => c.disciplinas || []),
    ...disciplinasSemCiclo,
  ];

  return {
    ciclos,
    disciplinas_sem_ciclo: disciplinasSemCiclo,
    todas_disciplinas: todasDisciplinas,
    minha_turma: data?.minha_turma || null,
    minhas_disciplinas: data?.minhas_disciplinas || [],
  };
};

/**
 * Cria um novo Ciclo Escolar (ex: "1º Ano", "2º Ano", "3º Ano").
 */
export const criarCiclo = async (dados) => {
  const response = await api("/ciclos", {
    method: "POST",
    body: dados,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data?.errors ? Object.values(data.errors).flat()[0] : null) || data?.message || "Não foi possível criar o ciclo escolar.");
  }

  return data;
};

/**
 * Atualiza um Ciclo Escolar existente.
 */
export const atualizarCiclo = async (idCiclo, dados) => {
  const response = await api(`/ciclos/${encodeURIComponent(idCiclo)}`, {
    method: "PUT",
    body: dados,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Prioriza a primeira mensagem de validação (ex: "máx. 256 caracteres")
    throw new Error((data?.errors ? Object.values(data.errors).flat()[0] : null) || data?.message || "Não foi possível atualizar o ciclo escolar.");
  }

  return data;
};

/**
 * Exclui um Ciclo Escolar.
 */
export const excluirCiclo = async (idCiclo) => {
  const response = await api(`/ciclos/${encodeURIComponent(idCiclo)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Não foi possível excluir o ciclo escolar.");
  }

  return true;
};

/**
 * Lista todas as disciplinas cadastradas, com suporte a busca por nome e filtro por ciclo.
 */
export const listarDisciplinas = async (filtros = {}, { signal } = {}) => {
  const params = new URLSearchParams();
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.ciclo_id) params.set("ciclo_id", String(filtros.ciclo_id));
  if (filtros.vinculadas) params.set("vinculadas", "1");

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await api(`/disciplinas${query}`, { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar as disciplinas.");
  }

  return Array.isArray(data) ? data : data?.data || [];
};

/**
 * Cadastra uma nova disciplina (com aulas semanais, ementa, BNCC, objetivos e vínculo de ciclos).
 */
export const criarDisciplina = async (dados) => {
  const response = await api("/disciplinas", {
    method: "POST",
    body: dados,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const primeiraMsg = data?.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(primeiraMsg || data?.message || "Não foi possível cadastrar a disciplina.");
  }

  return data;
};

/**
 * Atualiza uma disciplina existente e sincroniza seus ciclos e professores.
 */
export const atualizarDisciplina = async (idDisciplina, dados) => {
  const response = await api(`/disciplinas/${encodeURIComponent(idDisciplina)}`, {
    method: "PUT",
    body: dados,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const primeiraMsg = data?.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(primeiraMsg || data?.message || "Não foi possível atualizar a disciplina.");
  }

  return data;
};

/**
 * Remove uma disciplina do catálogo escolar.
 */
export const excluirDisciplina = async (idDisciplina) => {
  const response = await api(`/disciplinas/${encodeURIComponent(idDisciplina)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Não foi possível excluir a disciplina.");
  }

  return true;
};

export const disciplinasService = {
  listarCiclos,
  listarDisciplinasPorCiclo,
  criarCiclo,
  atualizarCiclo,
  excluirCiclo,
  listarDisciplinas,
  criarDisciplina,
  atualizarDisciplina,
  excluirDisciplina,
};
