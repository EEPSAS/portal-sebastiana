import { api } from './api';
import { getStoredToken } from './authService';

// Verifica se existe token salvo (o login é feito pelo AuthContext, igual ao resto do portal)
export const hasPortalSession = () => Boolean(getStoredToken());

// Chama a API reutilizando o helper `api` (ele já envia o token e limpa a sessão em caso de 401)
const requestJson = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await api(path, { method, body, signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || 'Não foi possível concluir a solicitação.');
    // O status permite à tela da biblioteca redirecionar para o login quando for 401
    error.status = response.status;
    error.validationErrors = payload?.errors ?? {};
    throw error;
  }

  return payload;
};

export const loadBiblioteca = ({ signal } = {}) => requestJson('/biblioteca', { signal });

export const saveBiblioteca = (dados) => requestJson('/biblioteca', { method: 'PUT', body: { dados } });
