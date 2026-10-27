import { api } from './api';

/**
 * authService.js - Serviço de Autenticação e Sessão (Módulo 1)
 *
 * Papel Didático:
 * Centraliza todas as operações de autenticação via Laravel Sanctum (/api/auth/* e /api/user),
 * mantendo paridade 1:1 com a tabela do Módulo 1 em apiContract.md.
 */

/**
 * POST /auth/google — Autentica via credencial do Google e retorna { user, token, token_type }.
 * Salva o token Sanctum e os dados do usuário no localStorage em caso de sucesso.
 */
export const googleLogin = async ({ credential, turma_id }) => {
  // Envia a credencial institucional recebida do Google Identity Services para a API
  const response = await api('/auth/google', {
    method: 'POST',
    body: { credential, turma_id },
  });

  const data = await response.json();

  // Em caso de falha de validação ou credencial expirada, dispara o erro com a mensagem do servidor
  if (!response.ok) {
    const error = new Error(data.message || 'Erro ao realizar login institucional com Google.');
    error.approvalStatus = data.approval_status || null;
    throw error;
  }

  // Persiste a sessão autenticada localmente para manter o estado após recarregar
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));

  return data;
};

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
    const error = new Error(data.message || 'Erro ao realizar login.');
    error.approvalStatus = data.approval_status || null;
    throw error;
  }

  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));

  return data;
};

/**
 * POST /auth/register — Auto-cadastro público de novo estudante (recebe role 'aluno').
 */
export const register = async (dadosCadastro) => {
  const response = await api('/auth/register', {
    method: 'POST',
    body: dadosCadastro,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Erro ao realizar cadastro.');
    error.errors = data.errors || null;
    throw error;
  }

  if (data.token && data.user) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }

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
 * GET /user — Valida o token atual e retorna o usuário atualizado (UsuarioResource).
 */
export const fetchCurrentUser = async ({ signal } = {}) => {
  const response = await api('/user', { signal });

  if (!response.ok) {
    const error = new Error('Sessão expirada.');
    error.status = response.status;
    throw error;
  }

  const user = await response.json();
  localStorage.setItem('auth_user', JSON.stringify(user));
  return user;
};

// Alias semântico para paridade 1:1 com apiContract.md
export const getUser = fetchCurrentUser;

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

export const authService = {
  googleLogin,
  login,
  register,
  logout,
  getUser,
  fetchCurrentUser,
  getStoredToken,
  getStoredUser,
};
