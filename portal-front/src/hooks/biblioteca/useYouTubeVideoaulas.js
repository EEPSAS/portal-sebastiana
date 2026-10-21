/**
 * useYouTubeVideoaulas.js - Hook Customizado de Busca e Validação de Videoaulas
 *
 * Papel Didático:
 * Isola a regra de consulta externa à API do YouTube, gerenciando estados de carregamento,
 * cancelamento assíncrono via `AbortController`, erros amigáveis e seleção prévia de vídeos
 * antes de serem persistidos na biblioteca escolar.
 */

import { useEffect, useRef, useState } from 'react';
import {
  searchYouTubeVideos,
  validateYouTubeVideo,
} from '../../services/biblioteca/youtubeService';

const MENSAGENS_ERRO_YOUTUBE = {
  MISSING_API_KEY:
    'Limite de consultas gratuitas ao YouTube atingido (HTTP 429). Configure uma chave VITE_YOUTUBE_API_KEY no arquivo .env para ampliar a cota.',
  API_ACCESS_FAILURE:
    'Limite de consultas gratuitas ao YouTube atingido (HTTP 429). Configure uma chave VITE_YOUTUBE_API_KEY no arquivo .env para ampliar a cota.',
  API_FAILURE: 'O YouTube não conseguiu concluir a solicitação. Tente novamente.',
  CONNECTION_FAILURE:
    'Problema de conexão. Verifique sua internet e tente novamente.',
  INVALID_VIDEO_ID: 'Este vídeo possui um identificador inválido.',
  VIDEO_UNAVAILABLE: 'Este vídeo está indisponível no YouTube.',
};

const traduzirErroYouTube = (error) =>
  MENSAGENS_ERRO_YOUTUBE[error?.code] ??
  'Não foi possível carregar o vídeo. Tente novamente.';

export const useYouTubeVideoaulas = () => {
  const [videoBusca, setVideoBusca] = useState('Literatura Brasileira');
  const [videosEncontrados, setVideosEncontrados] = useState([]);
  const [videoBuscaCarregando, setVideoBuscaCarregando] = useState(true);
  const [videoBuscaTentada, setVideoBuscaTentada] = useState(false);
  const [videoBuscaErro, setVideoBuscaErro] = useState('');
  const [proximaPaginaToken, setProximaPaginaToken] = useState(null);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const [videoSelecionado, setVideoSelecionado] = useState(null);
  const [urlVideoSelecionada, setUrlVideoSelecionada] = useState('');
  const [videoVerificandoId, setVideoVerificandoId] = useState('');
  const [videoPlayerErro, setVideoPlayerErro] = useState('');

  const buscaControllerRef = useRef(null);

  const pesquisarVideoaulas = async (event) => {
    if (event?.preventDefault) event.preventDefault();

    buscaControllerRef.current?.abort();
    const consulta = videoBusca.trim();

    if (!consulta) {
      setVideosEncontrados([]);
      setVideoBuscaTentada(false);
      setVideoBuscaCarregando(false);
      setVideoBuscaErro('Digite o nome da videoaula para pesquisar.');
      setVideoSelecionado(null);
      setUrlVideoSelecionada('');
      setVideoPlayerErro('');
      return;
    }

    const controller = new AbortController();
    buscaControllerRef.current = controller;
    setVideoBuscaCarregando(true);
    setVideoBuscaTentada(true);
    setVideoBuscaErro('');
    setVideoSelecionado(null);
    setUrlVideoSelecionada('');
    setVideoPlayerErro('');
    setProximaPaginaToken(null);

    try {
      const resultado = await searchYouTubeVideos(consulta, {
        signal: controller.signal,
      });
      if (buscaControllerRef.current === controller) {
        setVideosEncontrados(resultado.videos);
        setProximaPaginaToken(resultado.nextPageToken);
      }
    } catch (error) {
      if (
        error.name !== 'AbortError' &&
        buscaControllerRef.current === controller
      ) {
        setVideosEncontrados([]);
        setProximaPaginaToken(null);
        setVideoBuscaErro(traduzirErroYouTube(error));
      }
    } finally {
      if (buscaControllerRef.current === controller) {
        setVideoBuscaCarregando(false);
      }
    }
  };

  const carregarMaisVideoaulas = async () => {
    if (!proximaPaginaToken || carregandoMais || videoBuscaCarregando) return;
    const consulta = videoBusca.trim();
    if (!consulta) return;

    setCarregandoMais(true);
    try {
      const resultado = await searchYouTubeVideos(consulta, {
        pageToken: proximaPaginaToken,
      });
      setVideosEncontrados((prev) => [...prev, ...resultado.videos]);
      setProximaPaginaToken(resultado.nextPageToken);
    } catch (error) {
      setVideoBuscaErro(traduzirErroYouTube(error));
    } finally {
      setCarregandoMais(false);
    }
  };

  const selecionarVideoParaAssistir = (event, video) => {
    if (videoVerificandoId) {
      event?.preventDefault?.();
      return;
    }

    const url =
      video.url ||
      `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
    setVideoSelecionado({ ...video, url });
    setUrlVideoSelecionada(url);
    setVideoVerificandoId(video.videoId);
    setVideoPlayerErro('');

    validateYouTubeVideo(video.videoId)
      .then((dadosValidados) => {
        if (dadosValidados?.duration) {
          setVideoSelecionado((prev) =>
            prev && prev.videoId === video.videoId
              ? { ...prev, duration: dadosValidados.duration, url: dadosValidados.url || url }
              : prev
          );
        }
      })
      .catch((error) => setVideoPlayerErro(traduzirErroYouTube(error)))
      .finally(() => setVideoVerificandoId(''));
  };

  const limparSelecaoVideo = () => {
    setVideoSelecionado(null);
    setUrlVideoSelecionada('');
    setVideoPlayerErro('');
  };

  // Carrega automaticamente sugestões iniciais na montagem e cancela requisições ao desmontar
  useEffect(() => {
    const controller = new AbortController();
    buscaControllerRef.current = controller;

    searchYouTubeVideos('Literatura Brasileira', { signal: controller.signal })
      .then((resultado) => {
        if (buscaControllerRef.current === controller) {
          setVideosEncontrados(resultado.videos);
          setProximaPaginaToken(resultado.nextPageToken);
          setVideoBuscaTentada(true);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && buscaControllerRef.current === controller) {
          setVideosEncontrados([]);
          setVideoBuscaErro(traduzirErroYouTube(error));
          setVideoBuscaTentada(true);
        }
      })
      .finally(() => {
        if (buscaControllerRef.current === controller) {
          setVideoBuscaCarregando(false);
        }
      });

    return () => controller.abort();
  }, []);

  return {
    videoBusca,
    setVideoBusca,
    videosEncontrados,
    videoBuscaCarregando,
    videoBuscaTentada,
    videoBuscaErro,
    videoSelecionado,
    urlVideoSelecionada,
    videoVerificandoId,
    videoPlayerErro,
    proximaPaginaToken,
    carregandoMais,
    carregarMaisVideoaulas,
    pesquisarVideoaulas,
    selecionarVideoParaAssistir,
    limparSelecaoVideo,
  };
};

export default useYouTubeVideoaulas;
