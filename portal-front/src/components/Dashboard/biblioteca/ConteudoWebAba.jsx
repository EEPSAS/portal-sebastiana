/**
 * ConteudoWebAba.jsx - Pesquisa de Conteúdos Didáticos no Google Books API
 *
 * Papel Didático:
 * Centraliza a pesquisa em tempo real de referências pedagógicas, apostilas,
 * livros digitais e resumos acadêmicos consumindo a API oficial do Google Books.
 * Trata rigorosamente os 3 estados assíncronos: Carregando, Erro Amigável e Vazio.
 */

import { useState, useEffect, useRef } from 'react';
import { searchGoogleBooks } from '../../../services/biblioteca/googleBooksService';

const TERMOS_SUGERIDOS = [
  'Literatura Brasileira',
  'História do Brasil',
  'Matemática Ensino Médio',
  'Física Mecânica',
  'Biologia Celular',
  'Redação ENEM',
];

const ConteudoWebAba = ({ onAviso, onAdicionarAoPlano }) => {
  const [busca, setBusca] = useState('Literatura Brasileira');
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const abortControllerRef = useRef(null);

  // Carrega automaticamente sugestões pedagógicas na montagem do componente
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    searchGoogleBooks('Literatura Brasileira', { signal: controller.signal })
      .then((itens) => {
        setResultados(itens);
        setBuscaRealizada(true);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setErro(
            error.message ||
            'Não foi possível consultar os materiais no Google Books no momento. Tente novamente mais tarde.'
          );
          setBuscaRealizada(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      });

    return () => controller.abort();
  }, []);

  /**
   * Executa a busca assíncrona ao submeter o formulário ou clicar numa sugestão.
   */
  const executarBusca = async (termoPesquisa) => {
    const termo = (termoPesquisa ?? busca).trim();
    if (!termo) {
      onAviso?.('Digite um termo para pesquisar conteúdos no Google Books.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCarregando(true);
    setErro('');
    setBuscaRealizada(true);

    try {
      const itens = await searchGoogleBooks(termo, { signal: controller.signal });
      setResultados(itens);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setResultados([]);
      setErro(
        error.message ||
        'Não foi possível consultar os materiais no Google Books no momento. Tente novamente mais tarde.'
      );
    } finally {
      if (!controller.signal.aborted) {
        setCarregando(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executarBusca();
  };

  const handleSelecionarSugestao = (sugestao) => {
    setBusca(sugestao);
    executarBusca(sugestao);
  };

  return (
    <section aria-label="Conteúdo Web e Google Books">
      {/* Formulário de Busca */}
      <div className="bg-light p-3 p-md-4 rounded-4 mb-4 border border-light-subtle">
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-sm-row gap-2 mb-3">
          <div className="flex-grow-1 position-relative">
            <input
              type="search"
              className="form-control rounded-pill ps-4 py-2"
              placeholder="Pesquise por livros, disciplinas, tópicos ou autores no Google Books..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar conteúdos didáticos no Google Books"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary rounded-pill px-4 fw-semibold"
            disabled={carregando}
          >
            {carregando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Pesquisando...
              </>
            ) : (
              'Pesquisar'
            )}
          </button>
        </form>

        {/* Pílulas de Sugestões de Estudo */}
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted small fw-semibold">Sugestões de temas:</span>
          {TERMOS_SUGERIDOS.map((termo) => (
            <button
              key={termo}
              type="button"
              onClick={() => handleSelecionarSugestao(termo)}
              className="btn btn-sm btn-white bg-white border rounded-pill text-secondary py-1 px-3 small"
            >
              {termo}
            </button>
          ))}
        </div>
      </div>

      {/* Estado 1: Alerta de Erro Amigável */}
      {erro && (
        <div
          className="alert alert-warning d-flex justify-content-between align-items-center mb-4 rounded-3 shadow-sm"
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fs-5">⚠️</span>
            <span className="small fw-semibold text-warning-emphasis">{erro}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-dark rounded-pill fw-semibold"
            onClick={() => executarBusca()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado 2: Carregando com Spinner */}
      {carregando && (
        <div className="py-5 text-center text-muted" role="status">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="fw-semibold mb-0">Consultando referências no Google Books...</p>
        </div>
      )}

      {/* Grade de Resultados */}
      {!carregando && resultados.length > 0 && (
        <div className="row g-4">
          {resultados.map((obra) => (
            <div key={obra.id} className="col-12 col-md-6">
              <div className="card h-100 border-0 shadow-sm p-3 rounded-4 hover-shadow">
                <div className="d-flex gap-3">
                  {/* Capa da Obra */}
                  <div
                    className="flex-shrink-0 rounded-3 overflow-hidden bg-light d-flex align-items-center justify-content-center"
                    style={{ width: '84px', height: '120px' }}
                  >
                    {obra.thumbnail ? (
                      <img
                        src={obra.thumbnail}
                        alt={obra.titulo}
                        className="w-100 h-100 object-fit-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="fs-2 text-primary">📖</span>
                    )}
                  </div>

                  {/* Informações Bibliográficas */}
                  <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                    <h5
                      className="card-title fw-bold text-dark mb-1 fs-6 text-truncate"
                      title={obra.titulo}
                    >
                      {obra.titulo}
                    </h5>

                    <p className="card-subtitle text-muted small mb-2 text-truncate">
                      Por <strong>{obra.fonte}</strong>
                      {obra.dataPublicacao && ` · ${obra.dataPublicacao.slice(0, 4)}`}
                    </p>

                    <p className="card-text text-secondary small flex-grow-1 mb-3 line-clamp-3">
                      {obra.snippet}
                    </p>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top flex-wrap gap-2">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small">
                        Google Books
                      </span>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold small"
                          onClick={() =>
                            onAdicionarAoPlano?.({
                              tipo: 'conteudo_web',
                              conteudo_id: obra.id,
                              titulo: obra.titulo,
                              descricao: obra.snippet,
                              url: obra.link,
                              thumbnail: obra.thumbnail,
                              fonte: obra.fonte,
                              duracao: null,
                            })
                          }
                        >
                          + Adicionar aos planos
                        </button>

                        {obra.link && (
                          <a
                            href={obra.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold small"
                          >
                            Acessar Obra ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado 3: Vazio Obrigatório */}
      {!carregando && buscaRealizada && resultados.length === 0 && !erro && (
        <div className="py-5 text-center text-muted" role="status">
          <span className="fs-1 d-block mb-2">🔍</span>
          <p className="mb-1 fw-semibold fs-6">Nenhum conteúdo encontrado para "{busca}".</p>
          <p className="small text-secondary">
            Tente pesquisar com outras palavras-chave ou escolha uma das sugestões acima.
          </p>
        </div>
      )}
    </section>
  );
};

export default ConteudoWebAba;
