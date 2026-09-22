import { api } from './api';

/**
 * POST /auth/login — Autentica e retorna { user, token, token_type }.
 * Armazena token e user no localStorage em caso de sucesso.
 */
export const login = async ({ email, password }) => {
  const response = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao realizar login.');
  }

  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));

  return data;
};

/**
 * POST /auth/logout — Invalida o token no servidor e limpa localStorage.
 */
export const logout = async () => {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};

/**
 * GET /user — Valida o token atual e retorna o usuário atualizado.
 */
export const fetchCurrentUser = async ({ signal } = {}) => {
  const response = await api('/user', { signal });

  if (!response.ok) {
    throw new Error('Sessão expirada.');
  }

  const user = await response.json();
  localStorage.setItem('auth_user', JSON.stringify(user));
  return user;
};

/**
 * Retorna o token salvo (ou null se não houver).
 */
export const getStoredToken = () => localStorage.getItem('auth_token');

/**
 * Retorna o user salvo em localStorage (ou null).
 */
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('auth_user'));
  } catch {
    return null;
  }
};
