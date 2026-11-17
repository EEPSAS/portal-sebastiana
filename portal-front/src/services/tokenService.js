/**
 * tokenService.js - Serviço de Integração para Gestão de Sessões e Tokens Sanctum
 *
 * Papel Didático:
 * Centraliza as chamadas à API RESTful para consultar os tokens registrados em
 * personal_access_tokens (sem nunca expor a chave secreta), revogar sessões
 * manualmente e acionar a limpeza de tokens vencidos (> 6 horas).
 */

import { api } from './api';

/**
 * GET /api/tokens — Lista os tokens Sanctum com paginação e filtros (Privativo: Administrador).
 *
 * @param {object} filtros Filtros opcionais: { busca, origem, status, usuario_id, page, per_page }
 * @param {object} opcoes Opções de requisição: { signal }
 */
export const listarTokens = async (filtros = {}, { signal } = {}) => {
  const params = new URLSearchParams();

  // Anexa apenas os filtros efetivamente preenchidos na URL
  if (filtros.busca) params.set('busca', filtros.busca);
  if (filtros.origem) params.set('origem', filtros.origem);
  if (filtros.status) params.set('status', filtros.status);
  if (filtros.usuario_id) params.set('usuario_id', String(filtros.usuario_id));
  if (filtros.page) params.set('page', String(filtros.page));
  params.set('per_page', String(filtros.per_page || 15));

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api(`/tokens${query}`, { signal });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Não foi possível carregar as sessões e tokens do sistema.');
  }

  return data;
};

/**
 * DELETE /api/tokens/{id} — Revoga e remove fisicamente um token específico do banco de dados.
 *
 * @param {number|string} tokenId Identificador do registro na tabela personal_access_tokens
 */
export const revogarToken = async (tokenId) => {
  const response = await api(`/tokens/${encodeURIComponent(tokenId)}`, {
    method: 'DELETE',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Não foi possível revogar o token selecionado.');
  }

  return data;
};

/**
 * DELETE /api/usuarios/{id}/tokens — Revoga todas as sessões ativas de um usuário específico.
 *
 * @param {number|string} usuarioId Identificador do usuário
 */
export const revogarTokensDoUsuario = async (usuarioId) => {
  const response = await api(`/usuarios/${encodeURIComponent(usuarioId)}/tokens`, {
    method: 'DELETE',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Não foi possível revogar as sessões deste usuário.');
  }

  return data;
};

/**
 * DELETE /api/tokens/expirados — Aciona manualmente a limpeza imediata dos tokens vencidos (> 6 horas).
 */
export const limparTokensExpirados = async () => {
  const response = await api('/tokens/expirados', {
    method: 'DELETE',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Não foi possível executar a limpeza de tokens expirados.');
  }

  return data;
};

export const tokenService = {
  listarTokens,
  revogarToken,
  revogarTokensDoUsuario,
  limparTokensExpirados,
};
