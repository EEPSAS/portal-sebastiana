/**
 * donaNanaService.js - Serviço de Integração com a Assistente Virtual Dona Nana
 *
 * Papel Didático:
 * Centraliza toda a comunicação HTTP entre a interface React e o backend Laravel
 * para as funcionalidades da Dona Nana (Gemini 3.8 Flash):
 * 1. `enviarMensagem`: Envio de prompts rápidos e histórico de conversas multi-turn;
 * 2. `obterConfiguracao`: Carregamento dos 4 campos da persona e avatar para gestão;
 * 3. `salvarConfiguracao`: Atualização dos pilares do prompt por Especialistas e Admins.
 */

import { api } from './api';

/**
 * Função utilitária interna para requisições padronizadas da Dona Nana.
 */
const request = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await api(path, {
    method,
    body,
    signal,
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || `Não foi possível conversar com a Dona Nana no momento (${response.status}).`
    );
    error.status = response.status;
    error.details = data?.errors || null;
    throw error;
  }

  return data;
};

/**
 * Envia uma mensagem para a Dona Nana e recebe a resposta processada pelo Gemini 3.8 Flash.
 *
 * @param {object} params
 * @param {string} params.mensagem Texto digitado pelo usuário.
 * @param {Array<{role: string, text: string}>} [params.historico] Diálogos anteriores da sessão.
 * @param {'aba'|'balao'} [params.contextoOrigem] Identifica a origem da conversa.
 * @param {AbortSignal} [params.signal] Sinal para cancelamento de requisição pendente.
 */
export const enviarMensagem = async ({ mensagem, historico = [], contextoOrigem = 'aba', signal } = {}) => {
  return request('/dona-nana/chat', {
    method: 'POST',
    body: {
      mensagem,
      historico,
      contexto_origem: contextoOrigem,
    },
    signal,
  });
};

/**
 * Obtém a configuração ativa da persona da Dona Nana (Especialista e Adm).
 */
export const obterConfiguracao = async ({ signal } = {}) => {
  return request('/dona-nana/config', {
    method: 'GET',
    signal,
  });
};

/**
 * Atualiza os 4 campos do System Prompt e configurações da persona (Especialista e Adm).
 *
 * @param {object} config
 * @param {string} config.personalidade
 * @param {string} config.conhecimento_portal
 * @param {string} config.historias_causos
 * @param {string} config.diretrizes_resposta
 * @param {string} [config.avatar_url]
 */
export const salvarConfiguracao = async (config, { signal } = {}) => {
  return request('/dona-nana/config', {
    method: 'PUT',
    body: config,
    signal,
  });
};
