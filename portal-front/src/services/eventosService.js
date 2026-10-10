/**
 * eventosService.js - Serviço de Integração da Agenda de Eventos
 *
 * Por que centralizar aqui?
 * No modelo arquitetural adotado, os componentes de interface (UI) nunca chamam `fetch`
 * diretamente. Este serviço abstrai as operações de CRUD da agenda, padronizando cabeçalhos,
 * serialização de campos e tratamento de erros amigáveis em português.
 */

import { getApiTypeFromCategory, getCategoryFromApiType } from '../components/Dashboard/agenda/agendaConfig';
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
  endTime: evento.hora_fim?.slice(0, 5) || '',
  allDay: evento.dia_inteiro,
  category: getCategoryFromApiType(evento.tipo),
  important: evento.importante,
  location: evento.local || '',
  color: evento.cor || '',
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
  endTime: 'hora_fim',
  allDay: 'dia_inteiro',
  important: 'importante',
  location: 'local',
  color: 'cor',
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
 * Lista todos os eventos cadastrados na API.
 */
export const listEventos = async ({ signal, token } = {}) => {
  const eventos = await request('/eventos', { signal, token });
  if (!Array.isArray(eventos)) throw new Error('A resposta da API de eventos está em formato inválido.');
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
 * Atualiza um evento existente.
 */
export const updateEvento = async (evento, { token } = {}) => {
  const updatedEvento = await request(`/eventos/${encodeURIComponent(evento.id)}`, {
    method: 'PATCH',
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
