const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const authSessionKey = 'portal-sebastiana-auth';

const getResponseBody = async (response) => response.json().catch(() => ({}));

const getErrorMessage = (body, fallback) => {
  const validationMessages = Object.values(body.errors || {}).flat();
  return body.message || validationMessages.join(' ') || fallback;
};

export const getAuthSession = () => {
  try {
    const storedSession = window.sessionStorage.getItem(authSessionKey);
    const session = storedSession ? JSON.parse(storedSession) : null;

    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
};

export const getAuthToken = () => getAuthSession()?.token || null;

export const login = async ({ email, password }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await getResponseBody(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Não foi possível entrar.'));
  }

  if (!body.token || !body.user) {
    throw new Error('A resposta de autenticação não contém uma sessão válida.');
  }

  const session = {
    user: body.user,
    token: body.token,
    token_type: body.token_type || 'Bearer',
  };

  window.sessionStorage.setItem(authSessionKey, JSON.stringify(session));
  return session;
};

export const logout = async () => {
  const token = getAuthToken();

  try {
    if (token) {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = await getResponseBody(response);
        throw new Error(getErrorMessage(body, 'Não foi possível encerrar a sessão.'));
      }
    }
  } finally {
    window.sessionStorage.removeItem(authSessionKey);
  }
};