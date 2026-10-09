const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

/**
 * Faz uma requisição fetch com JSON e, se houver token em localStorage,
 * injeta o header Authorization automaticamente.
 */
export const api = async (path, { method = 'GET', body, signal, headers = {} } = {}) => {
  const token = localStorage.getItem('auth_token');
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const config = {
    method,
    signal,
    headers: {
      'Accept': 'application/json',
      // Quando é FormData, o navegador define o Content-Type multipart/form-data com o boundary correto
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, config);

  // Se 401 em qualquer chamada autenticada, limpa o token expirado
  if (response.status === 401 && token) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  return response;
};
