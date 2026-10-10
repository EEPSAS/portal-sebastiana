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
  MISSING_API_KEY: 'A chave da API do YouTube não foi configurada.',
  API_ACCESS_FAILURE:
    'Não foi possível acessar o YouTube. Verifique a chave e a cota da API.',
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
  const [videoBusca, setVideoBusca] = useState('');
  const [videosEncontrados, setVideosEncontrados] = useState([]);
  const [videoBuscaCarregando, setVideoBuscaCarregando] = useState(false);
  const [videoBuscaTentada, setVideoBuscaTentada] = useState(false);
  const [videoBuscaErro, setVideoBuscaErro] = useState('');

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

    try {
      const videos = await searchYouTubeVideos(consulta, {
        signal: controller.signal,
      });
      if (buscaControllerRef.current === controller) {
        setVideosEncontrados(videos);
      }
    } catch (error) {
      if (
        error.name !== 'AbortError' &&
        buscaControllerRef.current === controller
      ) {
        setVideosEncontrados([]);
        setVideoBuscaErro(traduzirErroYouTube(error));
      }
    } finally {
      if (buscaControllerRef.current === controller) {
        setVideoBuscaCarregando(false);
      }
    }
  };

  const selecionarVideoParaAssistir = (event, video) => {
    if (videoVerificandoId) {
      event?.preventDefault?.();
      return;
    }

    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(
      video.videoId
    )}`;
    setVideoSelecionado(video);
    setUrlVideoSelecionada(url);
    setVideoVerificandoId(video.videoId);
    setVideoPlayerErro('');

    validateYouTubeVideo(video.videoId)
      .catch((error) => setVideoPlayerErro(traduzirErroYouTube(error)))
      .finally(() => setVideoVerificandoId(''));
  };

  const limparSelecaoVideo = () => {
    setVideoSelecionado(null);
    setUrlVideoSelecionada('');
    setVideoPlayerErro('');
  };

  // Cancela requisições em trânsito ao desmontar o componente
  useEffect(() => () => buscaControllerRef.current?.abort(), []);

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
    pesquisarVideoaulas,
    selecionarVideoParaAssistir,
    limparSelecaoVideo,
  };
};

export default useYouTubeVideoaulas;
