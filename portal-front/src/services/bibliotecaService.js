/**
 * bibliotecaService.js - Serviço de Integração da Biblioteca Escolar
 *
 * Por que renomear de portalApi para bibliotecaService?
 * O nome anterior era genérico demais ('portalApi') e escondia o real propósito do módulo,
 * que é lidar com o acervo e dados da biblioteca escolar. Seguindo a regra de nomenclatura
 * do AGENTS.md, serviços devem ter nomes específicos no formato `camelCaseService.js`.
 */

import { api } from './api';
import { getStoredToken } from './authService';

/**
 * Verifica se existe uma sessão ativa (token armazenado) para consultas da biblioteca.
 * @returns {boolean}
 */
export const hasPortalSession = () => Boolean(getStoredToken());

/**
 * Wrapper didático para requisições com resposta JSON da biblioteca.
 * Centraliza o parsing da resposta e a emissão de erros amigáveis.
 */
const requestJson = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await api(path, { method, body, signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || 'Não foi possível carregar os dados da biblioteca escolar.');
    error.status = response.status;
    error.validationErrors = payload?.errors ?? {};
    throw error;
  }

  return payload;
};

/**
 * Carrega os dados do acervo da biblioteca escolar.
 */
export const loadBiblioteca = ({ signal } = {}) => requestJson('/biblioteca', { signal });

/**
 * Salva ou atualiza os dados do acervo da biblioteca escolar.
 */
export const saveBiblioteca = (dados) => requestJson('/biblioteca', { method: 'PUT', body: { dados } });
