/**
 * AcervoAba.jsx - Aba Coesa de Gestão do Acervo de Livros
 *
 * Papel Didático:
 * Centraliza a apresentação do acervo bibliográfico (físico e digital):
 * - Grid responsivo de cartões de livros;
 * - Modal controlado de cadastro/edição de títulos com upload de capa;
 * - Modal de resenhas e avaliações dos estudantes.
 *
 * Mantém todos os componentes da aba de livros reunidos em um único módulo,
 * evitando fragmentação desnecessária e simplificando a manutenção.
 */

import { useState } from 'react';

const ESTADO_LIVRO_INICIAL = {
  id: null,
  titulo: '',
  autor: '',
  status: 'Disponível',
  aluno: '',
  imagem: '',
  nota: '4.5',
};

const AcervoAba = ({
  livros = [],
  onSalvarLivro,
  onExcluirLivro,
  onAdicionarComentario,
  onAviso,
}) => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState(null);
  const [formData, setFormData] = useState(ESTADO_LIVRO_INICIAL);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [comentarioNota, setComentarioNota] = useState('');

  // ================= Ações de Formulário =================
  const abrirNovoLivro = () => {
    setFormData(ESTADO_LIVRO_INICIAL);
    setModalFormAberto(true);
  };

  const abrirEdicaoLivro = (livro) => {
    setFormData({ ...livro });
    setModalFormAberto(true);
  };

  const abrirDetalhes = (livro) => {
    setLivroSelecionado(livro);
    setComentarioTexto('');
    setComentarioNota('');
    setModalDetalhesAberto(true);
  };

  const handleSubmitLivro = (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.autor.trim()) return;

    onSalvarLivro(formData);
    setModalFormAberto(false);
  };

  const selecionarCapa = (event) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      onAviso?.('Selecione uma imagem PNG, JPEG ou WebP.');
      event.target.value = '';
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      onAviso?.('A imagem deve ter no máximo 2 MB.');
      event.target.value = '';
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      setFormData((prev) => ({ ...prev, imagem: leitor.result }));
    };
    leitor.readAsDataURL(arquivo);
  };

  const handleEnviarComentario = (e) => {
    e.preventDefault();
    if (!comentarioTexto.trim() || !livroSelecionado) return;

    onAdicionarComentario(livroSelecionado.id, {
      nome: 'Você',
      texto: comentarioTexto.trim(),
      nota: comentarioNota ? Number(comentarioNota) : null,
      data: new Intl.DateTimeFormat('pt-BR').format(new Date()),
    });

    setComentarioTexto('');
    setComentarioNota('');
  };

  // Atualiza a visualização do livro selecionado nos detalhes se os comentários mudarem
  const livroAtivoDetalhes =
    livros.find((l) => l.id === livroSelecionado?.id) || livroSelecionado;

  return (
    <section aria-label="Acervo de Livros">
      {/* Botão de Ação Superior */}
      <div className="d-flex justify-content-end mb-4">
        <button
          type="button"
          onClick={abrirNovoLivro}
          className="btn rounded-pill px-4 py-2 biblioteca-btn-primario shadow-sm small"
        >
          + Cadastrar Livro
        </button>
      </div>

      {/* Grade de Livros */}
      <div className="row g-4">
        {livros.map((livro) => {
          const disponivel = livro.status === 'Disponível';
          return (
            <div key={livro.id} className="col-12 col-sm-6 col-md-4 col-xl-3">
              <div className="card h-100 border-0 shadow-sm livro-card">
                {/* Capa */}
                <div
                  className="livro-card-cover"
                  style={{ backgroundColor: livro.corCapa || '#f8f9fa' }}
                >
                  {livro.imagem ? (
                    <img src={livro.imagem} alt={livro.titulo} loading="lazy" />
                  ) : (
                    <div
                      className="livro-card-placeholder"
                      style={{ color: livro.corIcone || '#3b82f6' }}
                    >
                      📖
                    </div>
                  )}
                  <div className="livro-card-rating">
                    ★ <span>{livro.nota || '4.5'}</span>
                  </div>
                </div>

                {/* Corpo do Cartão */}
                <div className="card-body d-flex flex-column p-3">
                  <h5
                    className="card-title fw-bold mb-1 text-truncate text-dark"
                    title={livro.titulo}
                  >
                    {livro.titulo}
                  </h5>
                  <p className="card-text text-muted mb-2 text-truncate small">
                    {livro.autor}
                  </p>

                  {livro.comentarios?.length > 0 && (
                    <p className="text-secondary mb-2 small text-truncate">
                      “{livro.comentarios[0].texto}”
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => abrirDetalhes(livro)}
                    className="btn btn-link p-0 text-start text-decoration-none fw-semibold mb-3 text-primary small"
                  >
                    Ver {livro.comentarios?.length ?? 0} comentário(s) 💬
                  </button>

                  <div className="mt-auto">
                    {disponivel ? (
                      <div className="text-center py-1 mb-3 rounded-pill fw-semibold livro-status-badge--disponivel">
                        Disponível
                      </div>
                    ) : (
                      <div className="mb-3 text-center">
                        <div className="py-1 rounded-pill fw-semibold livro-status-badge--emprestado">
                          Emprestado
                        </div>
                        {livro.aluno && (
                          <span className="text-muted d-block mt-1 text-truncate small">
                            {livro.aluno}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicaoLivro(livro)}
                        className="btn btn-sm btn-outline-primary w-50 rounded-pill"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onExcluirLivro({
                            id: livro.id,
                            tipo: 'livro',
                            nome: livro.titulo,
                          })
                        }
                        className="btn btn-sm btn-outline-danger w-50 rounded-pill"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {livros.length === 0 && (
          <div className="col-12 text-center text-muted py-5">
            <p className="mb-0 fs-6">Nenhum livro encontrado.</p>
          </div>
        )}
      </div>

      {/* ================= Modal: Cadastro / Edição de Livro ================= */}
      {modalFormAberto && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setModalFormAberto(false)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog p-4 position-relative"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-livro-titulo"
          >
            <button
              type="button"
              onClick={() => setModalFormAberto(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Fechar formulário"
            />
            <h4 id="form-livro-titulo" className="fw-bold mb-3 text-dark fs-5">
              {formData.id ? 'Editar Livro' : 'Cadastrar Livro'}
            </h4>
            <form onSubmit={handleSubmitLivro}>
              <div className="mb-2">
                <label htmlFor="livro-titulo" className="form-label small fw-semibold mb-1">
                  Título
                </label>
                <input
                  id="livro-titulo"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex: Dom Casmurro"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-2">
                <label htmlFor="livro-autor" className="form-label small fw-semibold mb-1">
                  Autor
                </label>
                <input
                  id="livro-autor"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex: Machado de Assis"
                  value={formData.autor}
                  onChange={(e) =>
                    setFormData({ ...formData, autor: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="capa-livro" className="form-label small fw-semibold mb-1">
                  Capa do livro (opcional)
                </label>
                <input
                  id="capa-livro"
                  type="file"
                  className="form-control form-control-sm mb-2"
                  accept="image/*"
                  onChange={selecionarCapa}
                />
                {formData.imagem && (
                  <div className="d-flex align-items-center gap-3 mt-2">
                    <img
                      src={formData.imagem}
                      alt="Prévia da capa"
                      className="rounded border"
                      style={{ width: '64px', height: '84px', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, imagem: '' }))
                      }
                    >
                      Remover capa
                    </button>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFormAberto(false)}
                  className="btn btn-sm btn-light border px-3 rounded-pill"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm biblioteca-btn-primario px-4 rounded-pill"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Modal: Detalhes e Comentários ================= */}
      {modalDetalhesAberto && livroAtivoDetalhes && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setModalDetalhesAberto(false)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog position-relative p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalhe-livro-titulo"
          >
            <button
              type="button"
              onClick={() => setModalDetalhesAberto(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Fechar modal"
            />

            <h3 id="detalhe-livro-titulo" className="fw-bold mb-1 text-dark fs-5">
              {livroAtivoDetalhes.titulo}
            </h3>
            <p className="text-muted mb-3 small">{livroAtivoDetalhes.autor}</p>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <div className="d-flex align-items-center gap-1 text-warning fs-6">
                  <span>★★★★★</span>
                  <span className="fw-bold text-dark ms-1 small">
                    {livroAtivoDetalhes.nota || '4.7'}
                  </span>
                </div>
                <small className="text-muted">
                  {livroAtivoDetalhes.avaliacoes || '27'} avaliações
                </small>
              </div>

              <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-semibold">
                {livroAtivoDetalhes.emprestimos || '41'} empréstimos
              </span>
            </div>

            <h5 className="fw-bold mb-1 text-dark fs-6">Principais comentários</h5>
            <div
              className="d-flex flex-column gap-3 mb-3 overflow-auto pe-1"
              style={{ maxHeight: '200px' }}
            >
              {(livroAtivoDetalhes.comentarios?.length ?? 0) === 0 ? (
                <p className="text-muted mb-0 small">
                  Ainda não há comentários para este livro.
                </p>
              ) : (
                livroAtivoDetalhes.comentarios.map((c, i) => (
                  <div className="border-bottom pb-2" key={i}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-dark small">{c.nome}</strong>
                      <span className="text-muted small">{c.data}</span>
                    </div>
                    <p className="text-secondary mb-0 small">{c.texto}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleEnviarComentario}>
              <textarea
                className="form-control form-control-sm mb-2"
                rows="2"
                placeholder="Escreva sua opinião..."
                value={comentarioTexto}
                onChange={(e) => setComentarioTexto(e.target.value)}
                required
              />
              <div className="d-flex justify-content-between align-items-center">
                <select
                  className="form-select form-select-sm w-auto"
                  value={comentarioNota}
                  onChange={(e) => setComentarioNota(e.target.value)}
                >
                  <option value="">Sem nota</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} estrela{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-sm biblioteca-btn-primario rounded-pill px-3"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AcervoAba;
