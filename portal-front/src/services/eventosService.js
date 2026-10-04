import { getApiTypeFromCategory, getCategoryFromApiType } from '../components/Dashboard/agenda/AgendaEspecialista/agendaConfig';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const request = async (path, { method = 'GET', body, signal, token } = {}) => {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
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
  date: String(evento.data_inicio).slice(0, 10),
  category: getCategoryFromApiType(evento.tipo),
  isCustom: true,
});

const serializeEvento = ({ title, date, category }) => ({
  titulo: title,
  data_inicio: date,
  tipo: getApiTypeFromCategory(category),
});

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
    method: 'PUT',
    body: serializeEvento(evento),
    token,
  });
  return mapEvento(updatedEvento);
};

export const deleteEvento = async (id, { token } = {}) => {
  await request(`/eventos/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  return true;
};