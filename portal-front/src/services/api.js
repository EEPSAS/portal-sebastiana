/**
 * Normaliza a URL base da API para suportar tanto o ambiente local quanto variáveis
 * de domínio público do Railway (com ou sem protocolo `https://` e sufixo `/api`).
 */
const normalizeApiUrl = (rawUrl) => {
  const trimmed = (rawUrl || 'http://localhost:8000/api').trim().replace(/\/+$/, '');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.endsWith('/api') ? withProtocol : `${withProtocol}/api`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

/**
 * Tempo padrão de vida do cache em memória para requisições GET (3 minutos em milissegundos).
 * Conforme alinhado no /grill-me, evita recarregamentos frequentes ao alternar entre abas.
 */
const DEFAULT_TTL_MS = 3 * 60 * 1000;

/**
 * Map em memória para armazenar o cache de respostas GET decodificadas.
 * Estrutura: path -> { bodyText, status, statusText, headers, timestamp, ttl }
 */
const memoryCache = new Map();

/**
 * Map em memória para deduplicar requisições em voo (In-Flight Requests).
 * Se duas abas ou componentes solicitarem o mesmo endpoint ao mesmo tempo,
 * compartilham a mesma Promise de rede em vez de disparar chamadas duplicadas.
 */
const inFlightRequests = new Map();

/**
 * Limpa todo o cache em memória e requisições pendentes.
 * Invocado principalmente no fluxo de logout para garantir isolamento entre contas.
 */
export const clearApiCache = () => {
  memoryCache.clear();
  inFlightRequests.clear();
};

/**
 * Invalida entradas de cache relacionadas quando ocorre uma mutação (POST, PUT, PATCH, DELETE).
 * Por exemplo, um POST em /eventos limpa automaticamente consultas em /eventos.
 */
const invalidateCacheForMutation = (path) => {
  const basePath = path.split('?')[0].replace(/\/+$/, '');
  
  // Extrai o primeiro segmento significativo da rota (ex: /eventos, /turmas, /noticias)
  const segments = basePath.split('/').filter(Boolean);
  const rootSegment = segments[0] ? `/${segments[0]}` : '';

  for (const cachedKey of memoryCache.keys()) {
    if (
      cachedKey.startsWith(basePath) ||
      (rootSegment && cachedKey.startsWith(rootSegment)) ||
      // Mutações acadêmicas também invalidam o painel geral
      (rootSegment === '/turmas' && cachedKey.startsWith('/dashboard/geral')) ||
      (rootSegment === '/disciplinas' && cachedKey.startsWith('/dashboard/geral'))
    ) {
      memoryCache.delete(cachedKey);
    }
  }
};

/**
 * Sintetiza um objeto compatível com a interface nativa Response a partir dos dados em cache.
 * Permite que chamadores continuem usando .json(), .text(), .status, .ok, etc.
 */
const createSyntheticResponse = (cachedItem) => {
  return new Response(cachedItem.bodyText, {
    status: cachedItem.status,
    statusText: cachedItem.statusText,
    headers: new Headers(cachedItem.headers),
  });
};

/**
 * Executa a chamada HTTP nativa com revalidação e persistência em cache.
 */
const executeNetworkFetch = async (url, config, path, isGet, ttl) => {
  const response = await fetch(url, config);

  // Se 401 em qualquer chamada autenticada, limpa credenciais e zera o cache local
  if (response.status === 401 && localStorage.getItem('auth_token')) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    clearApiCache();
  }

  // Apenas respostas de sucesso (2xx) em requisições GET são cacheadas em memória
  if (isGet && response.ok) {
    try {
      // Clona a resposta nativa para capturar o corpo em texto sem consumi-lo do chamador
      const clonedResponse = typeof response.clone === 'function' ? response.clone() : response;
      const bodyText = typeof clonedResponse.text === 'function'
        ? await clonedResponse.text()
        : typeof clonedResponse.json === 'function'
        ? JSON.stringify(await clonedResponse.json())
        : '';

      const headersObj = {};
      if (clonedResponse.headers && typeof clonedResponse.headers.forEach === 'function') {
        clonedResponse.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
      }

      memoryCache.set(path, {
        bodyText,
        status: response.status,
        statusText: response.statusText,
        headers: headersObj,
        timestamp: Date.now(),
        ttl,
      });
    } catch {
      // Se falhar a clonagem do corpo (ex: stream abortada ou mock de teste sem .clone), prossegue sem travar
    }
  }

  return response;
};

/**
 * Faz uma requisição fetch com JSON e, se houver token em localStorage,
 * injeta o header Authorization automaticamente.
 *
 * Inclui:
 * 1. Cache em memória Stale-While-Revalidate para requisições GET;
 * 2. Deduplicação de requisições em voo (inFlightRequests);
 * 3. Invalidação automática de cache em mutações (POST, PUT, PATCH, DELETE).
 */
export const api = async (
  path,
  {
    method = 'GET',
    body,
    signal,
    headers = {},
    skipCache = false,
    ttl = DEFAULT_TTL_MS,
  } = {}
) => {
  const token = localStorage.getItem('auth_token');
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isGet = method.toUpperCase() === 'GET';

  // Se for uma mutação, invalida o cache das rotas correspondentes imediatamente
  if (!isGet) {
    invalidateCacheForMutation(path);
  }

  // 1. Verificação de Cache em Memória para consultas GET
  if (isGet && !skipCache) {
    const cached = memoryCache.get(path);

    if (cached) {
      const isFresh = Date.now() - cached.timestamp < (cached.ttl || ttl);

      if (isFresh) {
        // Cache fresco (< TTL): Entrega em 0ms sem disparar requisição de rede
        return createSyntheticResponse(cached);
      }

      // Cache Stale (vencido): Aplica padrão Stale-While-Revalidate (SWR)
      // Dispara a revalidação em segundo plano sem bloquear nem exibir loading para o usuário
      executeNetworkFetch(`${API_URL}${path}`, {
        method,
        signal,
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      }, path, isGet, ttl).catch(() => {});

      // Retorna a cópia do cache antigo imediatamente para fluidez máxima
      return createSyntheticResponse(cached);
    }

    // 2. Deduplicação de requisições em voo para o mesmo endpoint
    if (inFlightRequests.has(path)) {
      const ongoingResponse = await inFlightRequests.get(path);
      return typeof ongoingResponse.clone === 'function' ? ongoingResponse.clone() : ongoingResponse;
    }
  }

  // Montagem da configuração oficial da requisição Fetch
  const config = {
    method,
    signal,
    headers: {
      'Accept': 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = isFormData
      ? body
      : typeof body === 'string'
      ? body
      : JSON.stringify(body);
  }

  const requestUrl = `${API_URL}${path}`;

  // Se for GET, registra a promessa no mapa de requisições em voo
  if (isGet) {
    const fetchPromise = executeNetworkFetch(requestUrl, config, path, isGet, ttl)
      .finally(() => {
        inFlightRequests.delete(path);
      });

    inFlightRequests.set(path, fetchPromise);
    const response = await fetchPromise;
    return typeof response.clone === 'function' ? response.clone() : response;
  }

  return executeNetworkFetch(requestUrl, config, path, isGet, ttl);
};
