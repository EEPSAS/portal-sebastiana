import { getApiTypeFromCategory, getCategoryFromApiType } from '../../components/Dashboard/agenda/AgendaEspecialista/agendaConfig';
import { api } from '../api';

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
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Não foi possível concluir a operação (${response.status}).`);
    error.status = response.status;
    error.details = data?.errors || null;
    throw error;
  }

  return data;
};

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

export const listEventos = async ({ signal, token } = {}) => {
  const eventos = await request('/eventos', { signal, token });
  if (!Array.isArray(eventos)) throw new Error('A resposta da API de eventos está em formato inválido.');
  return eventos.map(mapEvento);
};

export const createEvento = async (evento, { token } = {}) => {
  const createdEvento = await request('/eventos', {
    method: 'POST',
    body: serializeEvento(evento),
    token,
  });
  return mapEvento(createdEvento);
};

export const updateEvento = async (evento, { token } = {}) => {
  const updatedEvento = await request(`/eventos/${encodeURIComponent(evento.id)}`, {
    method: 'PATCH',
    body: serializeEvento(evento),
    token,
  });
  return mapEvento(updatedEvento);
};

export const deleteEvento = async (id, { token } = {}) => {
  await request(`/eventos/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  return true;
};