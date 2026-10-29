/**
 * PlanoDetalhe.jsx - Visualização Completa de Trilha / Plano de Estudos
 *
 * Papel Didático:
 * Rota dedicada `/dashboard/biblioteca/planos/:id` (Decisão de arquitetura aprovada).
 * Apresenta todos os materiais vinculados ao plano organizados em 3 seções:
 * 1. Livros do Acervo
 * 2. Videoaulas do YouTube
 * 3. Conteúdo Didático Web (Pesquisa Google)
 * Permite ao criador do plano desvincular itens preservando o conteúdo original na Biblioteca,
 * e permite aos alunos consultarem planos compartilhados pelos professores com sua turma.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { planosService } from '../../services/biblioteca/planosService';
import { formatarDisciplinaCiclo } from '../../utils/formatters';
import '../../components/Dashboard/biblioteca/Biblioteca.css';

export default function PlanoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plano, setPlano] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [removendoId, setRemovendoId] = useState(null);
  const [notificacao, setNotificacao] = useState('');

  // Carrega os dados do plano e seus itens associados
  useEffect(() => {
    let montado = true;

    if (id) {
      planosService
        .obterPorId(id)
        .then((dados) => {
          if (!montado) return;
          setPlano(dados);
        })
        .catch((err) => {
          if (!montado) return;
          setErro(err.message || 'Erro ao carregar o plano de estudos.');
        })
        .finally(() => {
          if (!montado) return;
          setCarregando(false);
        });
    }

    return () => {
      montado = false;
    };
  }, [id]);

  // Remove um item do plano de estudos sem afetar a biblioteca
  const handleRemoverItem = async (itemId) => {
    if (!window.confirm('Deseja realmente desvincular este conteúdo do plano de estudos?')) {
      return;
    }

    try {
      setRemovendoId(itemId);
      await planosService.removerItem(plano.id, itemId);

      // Atualiza o estado local removendo o item da lista
      setPlano((prev) => {
        if (!prev) return prev;
        const novosItens = (prev.itens || []).filter((it) => it.id !== itemId);
        const tipoRemovido = prev.itens?.find((it) => it.id === itemId)?.tipo;

        return {
          ...prev,
          itens: novosItens,
          livros_count: tipoRemovido === 'livro' ? Math.max(0, prev.livros_count - 1) : prev.livros_count,
          videoaulas_count: tipoRemovido === 'videoaula' ? Math.max(0, prev.videoaulas_count - 1) : prev.videoaulas_count,
          conteudos_web_count: tipoRemovido === 'conteudo_web' ? Math.max(0, prev.conteudos_web_count - 1) : prev.conteudos_web_count,
          total_itens: Math.max(0, (prev.total_itens || novosItens.length) - 1),
        };
      });

      setNotificacao('Conteúdo desvinculado do plano com sucesso.');
      setTimeout(() => setNotificacao(''), 4000);
    } catch (err) {
      alert(err.message || 'Erro ao desvincular item.');
    } finally {
      setRemovendoId(null);
    }
  };

  if (carregando) {
    return (
      <div className="container py-5 text-center text-muted" role="status">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="fw-semibold">Carregando plano de estudos completo...</p>
      </div>
    );
  }

  if (erro || !plano) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning rounded-4 p-4 shadow-sm" role="alert">
          <h5 className="alert-heading fw-bold">Não foi possível carregar o plano</h5>
          <p className="mb-3">{erro || 'Plano de estudos não encontrado.'}</p>
          <button
            type="button"
            className="btn btn-sm btn-dark rounded-pill px-4"
            onClick={() => navigate('/dashboard/biblioteca')}
          >
            ← Voltar para a Biblioteca
          </button>
        </div>
      </div>
    );
  }

  const itens = plano.itens || [];
  const livros = itens.filter((i) => i.tipo === 'livro');
  const videoaulas = itens.filter((i) => i.tipo === 'videoaula');
  const conteudosWeb = itens.filter((i) => i.tipo === 'conteudo_web');
  // Apenas o proprietário do plano pode desvincular materiais
  const podeEditarItens = plano.eh_proprietario !== false;

  return (
    <div className="position-relative">
      {/* Toast Flutuante de Confirmação */}
      {notificacao && (
        <div className="biblioteca-toast">
          <span>✓ {notificacao}</span>
        </div>
      )}

      {/* Cartão Central Principal */}
      <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
        {/* Cabeçalho da Trilha de Estudos */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom">
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <Link
                to="/dashboard/biblioteca"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold"
              >
                ← Voltar para a Biblioteca
              </Link>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill">
                {plano.disciplina_relacionada ? formatarDisciplinaCiclo(plano.disciplina_relacionada) : plano.disciplina}
              </span>
              {plano.conteudo && (
                <span className="badge bg-secondary-subtle text-secondary-emphasis border px-3 py-1 rounded-pill">
                  🏷️ {plano.conteudo}
                </span>
              )}
              {plano.compartilhado_por_professor && (
                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-3 py-1 rounded-pill">
                  🎓 Compartilhado por Prof. {plano.autor_nome || 'Docente'}
                </span>
              )}
            </div>
            <h2 className="fw-bold mb-1 text-dark fs-4">{plano.nome}</h2>
            {plano.descricao && (
              <p className="text-muted small mb-0">{plano.descricao}</p>
            )}
          </div>

          <div className="d-flex align-items-center gap-2 bg-light px-3 py-2 rounded-3 border">
            <span className="fw-semibold text-secondary small">Total de Materiais:</span>
            <span className="badge bg-success rounded-pill fs-6 px-3">
              {itens.length}
            </span>
          </div>
        </div>

        {/* Resumo de Contadores */}
        <div className="row g-3 mb-5">
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
              <span className="fs-2">📘</span>
              <div>
                <h6 className="fw-bold mb-0 text-dark">{livros.length} Livro{livros.length !== 1 ? 's' : ''}</h6>
                <small className="text-muted">Do acervo físico e digital</small>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
              <span className="fs-2">📺</span>
              <div>
                <h6 className="fw-bold mb-0 text-dark">{videoaulas.length} Videoaula{videoaulas.length !== 1 ? 's' : ''}</h6>
                <small className="text-muted">Do YouTube educacional</small>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-4 bg-light border border-light-subtle d-flex align-items-center gap-3">
              <span className="fs-2">📄</span>
              <div>
                <h6 className="fw-bold mb-0 text-dark">{conteudosWeb.length} Conteúdo{conteudosWeb.length !== 1 ? 's' : ''} Web</h6>
                <small className="text-muted">Artigos e conteúdos pesquisados na Web</small>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 1. Categoria: Livros ================= */}
        <section className="mb-5" aria-labelledby="secao-livros">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 id="secao-livros" className="fw-bold mb-0 text-dark fs-5 d-flex align-items-center gap-2">
              <span>📘</span> Livros Vinculados ({livros.length})
            </h4>
          </div>

          {livros.length === 0 ? (
            <div className="p-4 rounded-4 bg-light text-center text-muted border">
              <p className="mb-0 small">
                Nenhum livro vinculado a este plano. Vá até a aba <strong>Acervo de Livros</strong> para adicionar exemplares.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {livros.map((item) => (
                <div key={item.id} className="col-12 col-md-6">
                  <div className="card h-100 border p-3 rounded-4 shadow-sm d-flex flex-row gap-3 align-items-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="rounded object-fit-cover flex-shrink-0"
                        style={{ width: '64px', height: '80px' }}
                      />
                    ) : (
                      <div
                        className="bg-primary-subtle text-primary rounded d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '64px', height: '80px', fontSize: '28px' }}
                      >
                        📘
                      </div>
                    )}
                    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                      <h6 className="fw-bold text-dark mb-1 text-truncate" title={item.titulo}>
                        {item.titulo}
                      </h6>
                      {item.fonte && (
                        <p className="text-muted small mb-1 text-truncate">{item.fonte}</p>
                      )}
                      {item.descricao && (
                        <p className="text-secondary small mb-2 text-truncate">{item.descricao}</p>
                      )}
                      <div className="d-flex gap-2 mt-auto">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 small"
                          >
                            Acessar Obra ↗
                          </a>
                        )}
                        {podeEditarItens && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 small"
                            onClick={() => handleRemoverItem(item.id)}
                            disabled={removendoId === item.id}
                          >
                            {removendoId === item.id ? 'Removendo...' : 'Desvincular'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 2. Categoria: Videoaulas ================= */}
        <section className="mb-5" aria-labelledby="secao-videoaulas">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 id="secao-videoaulas" className="fw-bold mb-0 text-dark fs-5 d-flex align-items-center gap-2">
              <span>📺</span> Videoaulas do YouTube ({videoaulas.length})
            </h4>
          </div>

          {videoaulas.length === 0 ? (
            <div className="p-4 rounded-4 bg-light text-center text-muted border">
              <p className="mb-0 small">
                Nenhuma videoaula vinculada a este plano. Vá até a aba <strong>Videoaulas</strong> para pesquisar e adicionar vídeos.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {videoaulas.map((item) => (
                <div key={item.id} className="col-12 col-md-6">
                  <div className="card h-100 border p-3 rounded-4 shadow-sm d-flex flex-row gap-3 align-items-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="rounded object-fit-cover flex-shrink-0"
                        style={{ width: '100px', height: '68px' }}
                      />
                    ) : (
                      <div
                        className="bg-danger-subtle text-danger rounded d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '100px', height: '68px', fontSize: '28px' }}
                      >
                        📺
                      </div>
                    )}
                    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                      <h6 className="fw-bold text-dark mb-1 text-truncate" title={item.titulo}>
                        {item.titulo}
                      </h6>
                      <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
                        {item.fonte && (
                          <span className="text-muted small text-truncate">Canal: {item.fonte}</span>
                        )}
                        {item.duracao && (
                          <span className="badge bg-primary-subtle text-primary rounded-pill small">
                            ⏱️ {item.duracao}
                          </span>
                        )}
                      </div>
                      <div className="d-flex gap-2 mt-auto">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary rounded-pill px-3 small"
                          >
                            Assistir no YouTube ↗
                          </a>
                        )}
                        {podeEditarItens && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 small"
                            onClick={() => handleRemoverItem(item.id)}
                            disabled={removendoId === item.id}
                          >
                            {removendoId === item.id ? 'Removendo...' : 'Desvincular'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 3. Categoria: Conteúdo Didático Web ================= */}
        <section aria-labelledby="secao-web">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 id="secao-web" className="fw-bold mb-0 text-dark fs-5 d-flex align-items-center gap-2">
              <span>📄</span> Conteúdos Didáticos Web ({conteudosWeb.length})
            </h4>
          </div>

          {conteudosWeb.length === 0 ? (
            <div className="p-4 rounded-4 bg-light text-center text-muted border">
              <p className="mb-0 small">
                Nenhum conteúdo web vinculado a este plano. Vá até a aba <strong>Conteúdo Web</strong> para pesquisar referências.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {conteudosWeb.map((item) => (
                <div key={item.id} className="col-12 col-md-6">
                  <div className="card h-100 border p-3 rounded-4 shadow-sm d-flex flex-row gap-3 align-items-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="rounded object-fit-cover flex-shrink-0"
                        style={{ width: '64px', height: '80px' }}
                      />
                    ) : (
                      <div
                        className="bg-info-subtle text-info rounded d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '64px', height: '80px', fontSize: '28px' }}
                      >
                        📄
                      </div>
                    )}
                    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                      <h6 className="fw-bold text-dark mb-1 text-truncate" title={item.titulo}>
                        {item.titulo}
                      </h6>
                      {item.fonte && (
                        <p className="text-muted small mb-1 text-truncate">Fonte: {item.fonte}</p>
                      )}
                      {item.descricao && (
                        <p className="text-secondary small mb-2 text-truncate">{item.descricao}</p>
                      )}
                      <div className="d-flex gap-2 mt-auto">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 small"
                          >
                            Abrir Conteúdo ↗
                          </a>
                        )}
                        {podeEditarItens && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 small"
                            onClick={() => handleRemoverItem(item.id)}
                            disabled={removendoId === item.id}
                          >
                            {removendoId === item.id ? 'Removendo...' : 'Desvincular'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
