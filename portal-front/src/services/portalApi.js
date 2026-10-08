const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const SESSION_KEY = 'portal.session';
const DEMO_LIBRARY_KEY = 'portal.demo.biblioteca';

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const hasPortalSession = () => Boolean(readSession()?.token);

export const clearPortalSession = () => localStorage.removeItem(SESSION_KEY);

export const startDemoSession = () => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'dev-bypass', mode: 'demo' }));
};

const requestJson = async (path, { method = 'GET', body, signal, authenticated = true } = {}) => {
  const session = readSession();

  if (session?.mode === 'demo' && path === '/biblioteca') {
    if (method === 'PUT') {
      localStorage.setItem(DEMO_LIBRARY_KEY, JSON.stringify(body?.dados ?? {}));
      return { message: 'Biblioteca salva localmente.' };
    }

    if (method === 'GET') {
      let dados = null;
      try {
        dados = JSON.parse(localStorage.getItem(DEMO_LIBRARY_KEY) || 'null');
      } catch {
        localStorage.removeItem(DEMO_LIBRARY_KEY);
      }
      return { dados };
    }
  }

  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated && session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearPortalSession();
    }

    const error = new Error(payload?.message || 'Não foi possível concluir a solicitação.');
    error.status = response.status;
    error.validationErrors = payload?.errors ?? {};
    throw error;
  }

  return payload;
};

const authenticate = async (path, credentials) => {
  const session = await requestJson(path, { method: 'POST', body: credentials, authenticated: false });
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token, user: session.user }));
  return session.user;
};

export const login = (credentials) => authenticate('/auth/login', credentials);

export const register = (details) => authenticate('/auth/register', details);

export const loadBiblioteca = ({ signal } = {}) => requestJson('/biblioteca', { signal });

export const saveBiblioteca = (dados) => requestJson('/biblioteca', { method: 'PUT', body: { dados } });
