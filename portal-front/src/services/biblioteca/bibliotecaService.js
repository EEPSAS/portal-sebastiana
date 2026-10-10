/**
 * bibliotecaService.js - Serviço de Integração com a API da Biblioteca Escolar
 *
 * Papel Didático:
 * Centraliza as requisições HTTP para a rota `/biblioteca` do backend.
 * Utiliza o fetch centralizado em `../api.js` que injeta o token Bearer do Sanctum.
 */

import { api } from '../api';
import { getStoredToken } from '../authService';

/**
 * Verifica se o usuário possui sessão ativa (token armazenado).
 * @returns {boolean}
 */
export const hasPortalSession = () => Boolean(getStoredToken());

/**
 * Utilitário didático para processamento de respostas JSON da biblioteca.
 */
const requestJson = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await api(path, { method, body, signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message || 'Não foi possível carregar os dados da biblioteca escolar.'
    );
    error.status = response.status;
    error.validationErrors = payload?.errors ?? {};
    throw error;
  }

  return payload;
};

/**
 * Carrega todo o acervo da biblioteca escolar do usuário logado.
 */
export const loadBiblioteca = ({ signal } = {}) =>
  requestJson('/biblioteca', { signal });

/**
 * Salva as alterações de livros, planos, videoaulas e apostilas no backend.
 */
export const saveBiblioteca = (dados) =>
  requestJson('/biblioteca', { method: 'PUT', body: { dados } });