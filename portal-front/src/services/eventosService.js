import { getAuthToken } from './authService';
import { getCategoryFromEventType, getEventTypeFromCategory } from '../components/Dashboard/agenda/AgendaEspecialista/agendaConfig';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const getResponseBody = async (response) => {
  if (response.status === 204) return null;
  return response.json().catch(() => ({}));
};

const getErrorMessage = (body, fallback) => {
  const validationMessages = Object.values(body?.errors || {}).flat();
  return body?.message || validationMessages.join(' ') || fallback;
};

const request = async (path, { method = 'GET', body, signal } = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('Faça login para acessar os eventos.');

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const responseBody = await getResponseBody(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, `Não foi possível concluir a operação (${response.status}).`));
  }

  return responseBody;
};

export const mapEventoFromApi = (evento) => ({
  id: evento.id,
  title: evento.titulo,
  date: evento.data_inicio?.slice(0, 10),
  category: getCategoryFromEventType(evento.tipo),
  type: evento.tipo,
  important: evento.importante,
});

const mapEventoToApi = ({ title, date, category, type, important }) => ({
  titulo: title,
  data_inicio: date,
  tipo: type || getEventTypeFromCategory(category),
  ...(typeof important === 'boolean' ? { importante: important } : {}),
});

export const listEventos = async ({ signal } = {}) => {
  const eventos = await request('/eventos', { signal });
  return eventos.map(mapEventoFromApi);
};

export const createEvento = async (evento) => (
  mapEventoFromApi(await request('/eventos', {
    method: 'POST',
    body: mapEventoToApi(evento),
  }))
);

export const updateEvento = async (id, evento) => (
  mapEventoFromApi(await request(`/eventos/${id}`, {
    method: 'PATCH',
    body: mapEventoToApi(evento),
  }))
);

export const deleteEvento = async (id) => request(`/eventos/${id}`, { method: 'DELETE' });