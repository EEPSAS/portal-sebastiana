/**
 * eventosService.js - Serviço de Integração da Agenda de Eventos
 *
 * Por que centralizar aqui?
 * No modelo arquitetural adotado, os componentes de interface (UI) nunca chamam `fetch`
 * diretamente. Este serviço abstrai as operações de CRUD da agenda, padronizando cabeçalhos,
 * serialização de campos e tratamento de erros amigáveis em português.
 */

import { getApiTypeFromCategory, getCategoryFromApiType } from '../utils/agendaConfig';
import { api } from './api';

/**
 * Função utilitária interna para requisições com tratamento de resposta da API de Eventos.
 * @param {string} path Caminho do endpoint (ex: '/eventos')
 * @param {object} options Configurações de método, body, token e signal de cancelamento
 */
const request = async (path, { method = 'GET', body, signal, token } = {}) => {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await api(path, {
    method,
    headers: Object.fromEntries(headers),
    body,
    signal,
  });

  // Status 204 significa sucesso sem conteúdo no corpo (ex: remoção com DELETE)
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Não foi possível concluir a operação de eventos (${response.status}).`);
    error.status = response.status;
    error.details = data?.errors || null;
    throw error;
  }

  return data;
};

/**
 * Converte o formato retornado pelo Laravel (snake_case) para o formato esperado pelo front (camelCase).
 * Didática: Esse mapeamento desacopla o layout dos nomes de coluna do banco de dados.
 */
export const mapEvento = (evento) => ({
  ...evento,
  title: evento.titulo,
  description: evento.descricao || '',
  date: String(evento.data_inicio).slice(0, 10),
  endDate: evento.data_fim || '',
  startTime: evento.hora_inicio?.slice(0, 5) || '',
  category: getCategoryFromApiType(evento.tipo),
  important: Boolean(evento.importante),
  location: evento.local || '',
  creatorId: evento.criador_id,
  createdAt: evento.created_at,
  updatedAt: evento.updated_at,
  isCustom: true,
});

const eventFields = {
  title: 'titulo',
  description: 'descricao',
  date: 'data_inicio',
  endDate: 'data_fim',
  startTime: 'hora_inicio',
  important: 'importante',
  location: 'local',
};

/**
 * Prepara o objeto JavaScript para envio ao backend, convertendo de volta para snake_case.
 */
const serializeEvento = (evento) => {
  const payload = {};

  for (const [field, apiField] of Object.entries(eventFields)) {
    if (Object.hasOwn(evento, field)) payload[apiField] = evento[field];
    else if (Object.hasOwn(evento, apiField)) payload[apiField] = evento[apiField];
  }

  if (Object.hasOwn(evento, 'category')) payload.tipo = getApiTypeFromCategory(evento.category);
  else if (Object.hasOwn(evento, 'tipo')) payload.tipo = evento.tipo;

  return payload;
};

/**
 * Lista os eventos cadastrados na API.
 * Quando `publico: true`, consulta apenas os eventos institucionais (Portal Público).
 */
export const listEventos = async ({ signal, token, publico = false } = {}) => {
  const path = publico ? '/eventos?publico=1' : '/eventos';
  const eventos = await request(path, { signal, token });
  if (!Array.isArray(eventos)) throw new Error('A resposta da API de eventos está em formato inválido.');
  return eventos.map(mapEvento);
};

/**
 * GET /api/eventos/datas-importantes — Lista os eventos marcados como datas importantes.
 */
export const datasImportantes = async ({ signal, token, publico = false } = {}) => {
  const path = publico ? '/eventos/datas-importantes?publico=1' : '/eventos/datas-importantes';
  const eventos = await request(path, { signal, token });
  if (!Array.isArray(eventos)) throw new Error('A resposta de datas importantes está em formato inválido.');
  return eventos.map(mapEvento);
};

/**
 * Cria um novo evento escolar.
 */
export const createEvento = async (evento, { token } = {}) => {
  const createdEvento = await request('/eventos', {
    method: 'POST',
    body: serializeEvento(evento),
    token,
  });
  return mapEvento(createdEvento);
};

/**
 * Cria múltiplos eventos em lote no calendário (Cadastro em Massa - Item 5.6).
 */
export const createEventosEmMassa = async (eventos, { token } = {}) => {
  const payload = {
    eventos: eventos.map((ev) => ({
      data: ev.data || ev.date,
      titulo: ev.titulo || ev.title,
      // Converte a chave interna do front (ex.: 'sabados') para o rótulo oficial aceito pela API
      categoria: getApiTypeFromCategory(ev.categoria || ev.category),
      descricao: ev.descricao || ev.description,
    })),
  };

  const response = await request('/eventos/em-massa', {
    method: 'POST',
    body: payload,
    token,
  });

  return Array.isArray(response) ? response.map(mapEvento) : [];
};

/**
 * Atualiza um evento existente.
 */
export const updateEvento = async (evento, { token } = {}) => {
  const updatedEvento = await request(`/eventos/${encodeURIComponent(evento.id)}`, {
    method: 'PUT',
    body: serializeEvento(evento),
    token,
  });
  return mapEvento(updatedEvento);
};

/**
 * Exclui um evento escolar pelo ID.
 */
export const deleteEvento = async (id, { token } = {}) => {
  await request(`/eventos/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  return true;
};

// Aliases semânticos em português para paridade 1:1 com apiContract.md
export const listar = listEventos;
export const criar = createEvento;
export const criarEmMassa = createEventosEmMassa;
export const atualizar = updateEvento;
export const excluir = deleteEvento;

export const eventosService = {
  listar,
  datasImportantes,
  criar,
  criarEmMassa,
  atualizar,
  excluir,
};
