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
  // Verifica se a chave VITE_YOUTUBE_API_KEY foi preenchida no arquivo .env local
  if (
    !API_KEY ||
    API_KEY === 'SUA_CHAVE_DA_API' ||
    API_KEY === 'SUA_CHAVE_YOUTUBE_AQUI'
  ) {
    throw createApiError('MISSING_API_KEY');
  }

  const query = new URLSearchParams({ ...params, key: API_KEY });
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/${resource}?${query}`, { signal });
  } catch (error) {
    // Se a requisição foi cancelada pelo AbortController, propaga o erro sem convertê-lo
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
    // Status 403 ou 429 indicam chave restrita ou cota diária excedida no Google Cloud
    throw createApiError(
      response.status === 403 || response.status === 429
        ? 'API_ACCESS_FAILURE'
        : 'API_FAILURE'
    );
  }

  return payload;
};

/**
 * Converte a string de duração no padrão ISO 8601 do YouTube (ex: PT1H05M20S ou PT15M33S)
 * para um formato legível (HH:MM:SS ou MM:SS).
 * @param {string} isoDuration String ISO 8601 retornada em contentDetails.duration.
 * @returns {string} Duração formatada (ex: "15:33").
 */
export const formatarDuracaoISO8601 = (isoDuration) => {
  if (!isoDuration || typeof isoDuration !== 'string') return '';

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const horas = Number(match[1] || 0);
  const minutos = Number(match[2] || 0);
  const segundos = Number(match[3] || 0);

  if (horas > 0) {
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
};

/**
 * Pesquisa videoaulas no YouTube pelo termo informado e enriquece com duração e URL.
 * @param {string} searchTerm Termo de busca digitado pelo usuário.
 * @param {object} options Opções com signal para cancelamento.
 * @returns {Promise<Array>} Lista de vídeos formatados com duration e url.
 */
export const searchYouTubeVideos = async (searchTerm, { signal } = {}) => {
  // Inclui safeSearch=strict e videoEmbeddable=true para garantir conteúdo adequado ao ambiente escolar
  const payload = await requestYouTubeApi(
    'search',
    {
      part: 'snippet',
      type: 'video',
      maxResults: '12',
      safeSearch: 'strict',
      videoEmbeddable: 'true',
      relevanceLanguage: 'pt',
      q: searchTerm,
    },
    signal
  );

  const videosBasicos = (payload.items ?? [])
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
        thumbnail: thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? '',
        url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        duration: ''
      };
    })
    .filter(Boolean);

  if (videosBasicos.length === 0) {
    return [];
  }

  // Consulta o endpoint 'videos?part=contentDetails,status' em lote para capturar a duração de cada vídeo
  try {
    const ids = videosBasicos.map((v) => v.videoId).join(',');
    const detalhesPayload = await requestYouTubeApi('videos', {
      part: 'contentDetails,status',
      id: ids
    }, signal);

    const mapaDuracoes = {};
    (detalhesPayload.items ?? []).forEach((item) => {
      if (item.id && item.contentDetails?.duration) {
        mapaDuracoes[item.id] = formatarDuracaoISO8601(item.contentDetails.duration);
      }
    });

    return videosBasicos.map((video) => ({
      ...video,
      duration: mapaDuracoes[video.videoId] || ''
    }));
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    // Se a consulta complementar falhar, retorna os vídeos com os metadados básicos
    return videosBasicos;
  }
};

/**
 * Valida se um vídeo específico existe e está disponível publicamente no YouTube,
 * retornando também sua duração formatada e URL oficial.
 * @param {string} videoId ID de 11 caracteres do YouTube.
 */
export const validateYouTubeVideo = async (videoId) => {
  if (!VIDEO_ID_PATTERN.test(videoId ?? '')) {
    throw createApiError('INVALID_VIDEO_ID');
  }

  const payload = await requestYouTubeApi('videos', {
    part: 'status,contentDetails',
    id: videoId
  });
  const video = payload.items?.[0];

  if (!video) {
    throw createApiError('VIDEO_UNAVAILABLE');
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    duration: formatarDuracaoISO8601(video.contentDetails?.duration ?? '')
  };
};
