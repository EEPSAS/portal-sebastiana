import { api } from "./api";

const lerResposta = async (response, mensagemErro) => {
  const dados = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(dados?.message || mensagemErro);
  }
  return dados;
};

export const listarNotificacoes = async ({ page = 1, perPage = 30, signal } = {}) => {
  const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const response = await api(`/notificacoes?${query}`, { signal });
  return lerResposta(response, "Não foi possível carregar as notificações.");
};

export const listarSuperImportantes = async ({ signal } = {}) => {
  const response = await api("/notificacoes/super-importantes", { signal });
  return lerResposta(response, "Não foi possível carregar as notificações super-importantes.");
};

export const marcarNotificacaoLida = async (notificacaoId, { signal } = {}) => {
  const response = await api(`/notificacoes/${encodeURIComponent(notificacaoId)}/lida`, {
    method: "PATCH",
    signal,
  });
  return lerResposta(response, "Não foi possível confirmar a leitura.");
};

export const marcarPadraoComoLidas = async ({ signal } = {}) => {
  const response = await api("/notificacoes/marcar-padrao-lidas", {
    method: "PATCH",
    signal,
  });
  if (!response.ok) {
    const dados = await response.json().catch(() => null);
    throw new Error(dados?.message || "Não foi possível confirmar as notificações padrão.");
  }
};

export const criarNotificacao = async (dados, { signal } = {}) => {
  const response = await api("/notificacoes", {
    method: "POST",
    body: dados,
    signal,
  });
  return lerResposta(response, "Não foi possível enviar a notificação.");
};
