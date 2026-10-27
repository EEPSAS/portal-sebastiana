import { api } from "./api";

// Centraliza as chamadas autenticadas usadas pela fila exclusiva do Especialista.
const lerResposta = async (response, mensagemPadrao) => {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || mensagemPadrao);
  }

  return payload;
};

export const listarSolicitacoes = async () => {
  const response = await api("/aprovacoes/usuarios");
  const payload = await lerResposta(response, "Não foi possível carregar os pedidos.");
  const solicitacoes = Array.isArray(payload) ? payload : payload.data;

  if (!Array.isArray(solicitacoes)) {
    throw new Error("A resposta da API não contém uma lista de pedidos válida.");
  }

  return solicitacoes;
};

export const decidirSolicitacao = async (usuarioId, approvalStatus) => {
  const response = await api(`/aprovacoes/usuarios/${usuarioId}`, {
    method: "PATCH",
    body: { approval_status: approvalStatus },
  });

  return lerResposta(response, "Não foi possível atualizar o pedido.");
};

export const aprovacaoService = {
  listarSolicitacoes,
  decidirSolicitacao,
};
