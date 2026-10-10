/**
 * youtubeService.js - Integração com a API do YouTube v3
 *
 * Papel Didático:
 * Centraliza a busca e validação de disponibilidade de videoaulas no YouTube.
 * Utiliza o `fetch` nativo para consultar os endpoints de `search` e `videos`,
 * emitindo códigos de erro semânticos que são traduzidos em mensagens amigáveis na interface.
 */

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY?.trim() ?? '';
const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Cria um objeto de erro customizado com código semântico para exibição na UI.
 */
const createApiError = (code) => Object.assign(new Error(code), { code });

/**
 * Executa chamadas à API do YouTube com chave e suporte a cancelamento (`AbortSignal`).
 */
const requestYouTubeApi = async (resource, params, signal) => {
  if (!API_KEY || API_KEY === 'SUA_CHAVE_DA_API') {
    throw createApiError('MISSING_API_KEY');
  }

  const query = new URLSearchParams({ ...params, key: API_KEY });
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/${resource}?${query}`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw createApiError('CONNECTION_FAILURE');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw createApiError('API_FAILURE');
  }

  if (!response.ok || payload.error) {
    throw createApiError(response.status === 403 ? 'API_ACCESS_FAILURE' : 'API_FAILURE');
  }

  return payload;
};

/**
 * Pesquisa videoaulas no YouTube pelo termo informado.
 * @param {string} searchTerm Termo de busca digitado pelo usuário.
 * @param {object} options Opções com signal para cancelamento.
 * @returns {Promise<Array>} Lista de vídeos formatados.
 */
export const searchYouTubeVideos = async (searchTerm, { signal } = {}) => {
  const payload = await requestYouTubeApi('search', {
    part: 'snippet',
    type: 'video',
    maxResults: '12',
    q: searchTerm
  }, signal);

  return (payload.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId;
      if (!VIDEO_ID_PATTERN.test(videoId ?? '')) {
        return null;
      }

      const thumbnails = item.snippet?.thumbnails ?? {};
      return {
        videoId,
        title: item.snippet?.title ?? 'Videoaula sem título',
        description: item.snippet?.description ?? '',
        channelTitle: item.snippet?.channelTitle ?? 'Canal do YouTube',
        publishedAt: item.snippet?.publishedAt ?? '',
        thumbnail: thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? ''
      };
    })
    .filter(Boolean);
};

/**
 * Valida se um vídeo específico existe e está disponível publicamente no YouTube.
 * @param {string} videoId ID de 11 caracteres do YouTube.
 */
export const validateYouTubeVideo = async (videoId) => {
  if (!VIDEO_ID_PATTERN.test(videoId ?? '')) {
    throw createApiError('INVALID_VIDEO_ID');
  }

  const payload = await requestYouTubeApi('videos', {
    part: 'status',
    id: videoId
  });
  const video = payload.items?.[0];

  if (!video) {
    throw createApiError('VIDEO_UNAVAILABLE');
  }
};
