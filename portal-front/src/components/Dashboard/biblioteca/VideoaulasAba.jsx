/**
 * VideoaulasAba.jsx - Aba Coesa de Pesquisa e Adição de Videoaulas do YouTube
 *
 * Papel Didático:
 * Integração da biblioteca escolar com o YouTube:
 * - Campo de busca assíncrono com feedback de carregamento;
 * - Grade de resultados com thumbnail, canal e data;
 * - Validação e adição à lista de materiais salvos com prevenção de duplicidade.
 */

import { useYouTubeVideoaulas } from '../../../hooks/biblioteca/useYouTubeVideoaulas';
import './Biblioteca.css';

const VideoaulasAba = ({ videoaulas = [], onAdicionarVideoaula }) => {
  const {
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
  } = useYouTubeVideoaulas();

  const handleAdicionar = () => {
    if (
      !videoSelecionado ||
      !urlVideoSelecionada ||
      videoPlayerErro ||
      videoVerificandoId
    ) {
      return;
    }

    onAdicionarVideoaula({
      id: Date.now(),
      titulo: videoSelecionado.title,
      materia: (videoSelecionado.channelTitle || 'YouTube').slice(0, 100),
      corBadge: '#2563eb',
      descricao: videoSelecionado.description.slice(0, 1000),
      url: urlVideoSelecionada,
    });
  };

  const jaAdicionado = videoaulas.some(
    (video) => video.url === urlVideoSelecionada
  );

  return (
    <div className="videoaulas">
      {/* Formulário de Busca */}
      <form onSubmit={pesquisarVideoaulas} className="videoaulas-search">
        <div className="videoaulas-search__field">
          <label htmlFor="videoaulas-consulta" className="form-label small fw-semibold">
            Pesquisar no YouTube
          </label>
          <input
            id="videoaulas-consulta"
            type="search"
            className="form-control"
            placeholder="Digite o nome da videoaula..."
            value={videoBusca}
            onChange={(event) => setVideoBusca(event.target.value)}
            maxLength={200}
            aria-describedby="videoaulas-status"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary videoaulas-search__button"
          disabled={videoBuscaCarregando || Boolean(videoVerificandoId)}
        >
          {videoBuscaCarregando ? 'Pesquisando...' : 'Pesquisar'}
        </button>
      </form>

      {/* Estados de Status */}
      <div id="videoaulas-status" aria-live="polite">
        {videoBuscaErro && (
          <p className="alert alert-warning py-2 small" role="alert">
            {videoBuscaErro}
          </p>
        )}
        {videoBuscaCarregando && (
          <p className="text-muted small" role="status">
            Buscando videoaulas no YouTube...
          </p>
        )}
        {videoBuscaTentada &&
          !videoBuscaCarregando &&
          !videoBuscaErro &&
          videosEncontrados.length === 0 && (
            <p className="text-muted py-3 small">
              Nenhum vídeo encontrado para essa pesquisa.
            </p>
          )}
      </div>

      {/* Resultados da Pesquisa */}
      {videosEncontrados.length > 0 && (
        <section className="mb-4" aria-label="Resultados do YouTube">
          <h3 className="h6 fw-bold mb-3 text-dark">Resultados do YouTube</h3>
          <div className="videoaulas-grid">
            {videosEncontrados.map((video) => (
              <article
                className={`videoaulas-card${
                  videoSelecionado?.videoId === video.videoId ? ' is-selected' : ''
                }`}
                key={video.videoId}
              >
                {video.thumbnail ? (
                  <img
                    className="videoaulas-card__thumbnail"
                    src={video.thumbnail}
                    alt={`Thumbnail de ${video.title}`}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="videoaulas-card__thumbnail videoaulas-card__thumbnail--empty"
                    aria-hidden="true"
                  />
                )}
                <div className="videoaulas-card__body">
                  <h4 className="videoaulas-card__title">{video.title}</h4>
                  <p className="videoaulas-card__info">
                    {video.channelTitle}
                    {video.publishedAt
                      ? ` · ${new Date(video.publishedAt).toLocaleDateString(
                          'pt-BR'
                        )}`
                      : ''}
                  </p>
                  {video.description && (
                    <p className="videoaulas-card__description">
                      {video.description}
                    </p>
                  )}
                  <a
                    href={`https://www.youtube.com/watch?v=${encodeURIComponent(
                      video.videoId
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mt-auto btn-sm"
                    onClick={(event) => selecionarVideoParaAssistir(event, video)}
                    aria-label={`Assistir ${video.title} no YouTube`}
                  >
                    {videoVerificandoId === video.videoId
                      ? 'Verificando...'
                      : 'Assistir no YouTube'}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Barra de Ação de Adicionar */}
      <div className="videoaulas-add">
        <div className="videoaulas-add__field">
          <label
            htmlFor="videoaulas-url-selecionada"
            className="form-label small fw-semibold"
          >
            URL da videoaula selecionada
          </label>
          <input
            id="videoaulas-url-selecionada"
            type="url"
            className="form-control"
            value={urlVideoSelecionada}
            placeholder="Clique em Assistir para preencher a URL"
            readOnly
          />
        </div>
        <button
          type="button"
          className="btn btn-primary videoaulas-add__button"
          onClick={handleAdicionar}
          disabled={
            !videoSelecionado ||
            !urlVideoSelecionada ||
            Boolean(videoPlayerErro) ||
            Boolean(videoVerificandoId) ||
            jaAdicionado
          }
        >
          {jaAdicionado && urlVideoSelecionada ? 'Adicionado' : 'Adicionar'}
        </button>
      </div>

      {videoSelecionado && (
        <p className="videoaulas-selected-title small text-muted mt-2">
          Selecionado: <strong>{videoSelecionado.title}</strong>
        </p>
      )}

      {videoPlayerErro && (
        <p className="alert alert-warning py-2 small mt-2" role="alert">
          {videoPlayerErro}
        </p>
      )}

      {!videoBuscaTentada && !videoBuscaErro && videosEncontrados.length === 0 && (
        <p className="text-muted py-3 small">
          Pesquise no YouTube para encontrar videoaulas e integrá-las aos seus planos de estudos.
        </p>
      )}
    </div>
  );
};

export default VideoaulasAba;
