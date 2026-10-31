import { api } from "./api";

/**
 * periodosLetivosService.js - Serviço de Integração do Período Letivo
 *
 * Papel Didático:
 * Centraliza as operações HTTP da nova funcionalidade do módulo acadêmico:
 * - Listagem de períodos cadastrados e suas divisões (Bimestres/Trimestres)
 * - Consulta do período letivo atualmente ativo
 * - Criação, atualização e ativação de anos letivos
 * - Sincronização oficial de marcos com o calendário escolar institucional
 */

export const listarPeriodosLetivos = async ({ signal } = {}) => {
  const response = await api("/periodos-letivos", { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar os períodos letivos.");
  }

  return Array.isArray(data) ? data : data?.data || [];
};

export const obterPeriodoLetivoAtivo = async ({ signal } = {}) => {
  const response = await api("/periodos-letivos/ativo", { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(data?.message || "Não foi possível carregar o período letivo ativo.");
  }

  return data?.data || data || null;
};

export const obterPeriodoLetivo = async (id, { signal } = {}) => {
  const response = await api(`/periodos-letivos/${id}`, { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível carregar os detalhes do período letivo.");
  }

  return data?.data || data;
};

export const criarPeriodoLetivo = async (dados) => {
  // Envia o objeto diretamente: api() já se encarrega da serialização JSON
  const response = await api("/periodos-letivos", {
    method: "POST",
    body: dados,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || "Erro ao cadastrar período letivo.";
    const errors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new Error(`${errorMsg} ${errors}`.trim());
  }

  return data?.data || data;
};

export const atualizarPeriodoLetivo = async (id, dados) => {
  // Envia o objeto diretamente para atualização do período
  const response = await api(`/periodos-letivos/${id}`, {
    method: "PUT",
    body: dados,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || "Erro ao atualizar período letivo.";
    const errors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new Error(`${errorMsg} ${errors}`.trim());
  }

  return data?.data || data;
};

export const ativarPeriodoLetivo = async (id) => {
  const response = await api(`/periodos-letivos/${id}/ativar`, {
    method: "PATCH",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erro ao ativar período letivo.");
  }

  return data?.data || data;
};

export const excluirPeriodoLetivo = async (id) => {
  const response = await api(`/periodos-letivos/${id}`, {
    method: "DELETE",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || "Erro ao excluir período letivo.";
    const errors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new Error(`${errorMsg} ${errors}`.trim());
  }

  return data;
};

export const sincronizarAgendaPeriodo = async (id) => {
  const response = await api(`/periodos-letivos/${id}/sincronizar-agenda`, {
    method: "POST",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erro ao sincronizar marcos escolares na agenda.");
  }

  return data;
};
