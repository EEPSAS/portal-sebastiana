/**
 * PlanosAba.jsx - Aba Coesa de Gestão de Planos de Estudo
 *
 * Papel Didático:
 * Reúne toda a lógica da trilha de estudos:
 * - Formulário de criação rápida de plano por disciplina;
 * - Listagem de cartões de planos com contadores e tags temáticas;
 * - Modal completo para vincular/desvincular livros e conteúdos web às trilhas.
 */

import { useState } from 'react';

const MATERIAS_DISPONIVEIS = [
  'Matemática',
  'Português',
  'Redação',
  'Física',
  'Química',
  'Biologia',
  'História',
  'Geografia',
  'Filosofia',
  'Sociologia',
  'Inglês',
  'Espanhol',
];

const PlanosAba = ({
  planos = [],
  livros = [],
  apostilas = [],
  onCriarPlano,
  onExcluirPlano,
  onAlternarMaterial,
}) => {
  const [novoPlano, setNovoPlano] = useState({
    nome: '',
    disciplina: 'Matemática',
  });
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState(null);

  const planoAtivo = planos.find((p) => p.id === planoSelecionadoId);

  const handleSubmitCriar = (e) => {
    e.preventDefault();
    if (!novoPlano.nome.trim()) return;

    onCriarPlano(novoPlano);
    setNovoPlano({ nome: '', disciplina: 'Matemática' });
  };

  return (
    <section aria-label="Planos de Estudos">
      <div className="mb-4">
        <h4 className="fw-bold mb-1 text-dark fs-6">Meus Planos de Estudos</h4>
        <p className="text-muted mb-0 small">
          Crie pastas para organizar seus conteúdos web e livros por disciplina.
        </p>
      </div>

      {/* Formulário Rápido de Criação */}
      <form
        onSubmit={handleSubmitCriar}
        className="p-3 rounded-4 mb-4 border bg-light"
      >
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <label
              htmlFor="nome-plano"
              className="form-label mb-1 text-secondary fw-bold"
              style={{ fontSize: '11px' }}
            >
              NOME DO PLANO (Ex: Preparação ENEM)
            </label>
            <input
              id="nome-plano"
              type="text"
              className="form-control form-control-sm"
              placeholder="Nome do plano de estudos"
              value={novoPlano.nome}
              onChange={(e) =>
                setNovoPlano({ ...novoPlano, nome: e.target.value })
              }
              required
            />
          </div>

          <div className="col-12 col-md-4">
            <label
              htmlFor="disciplina-plano"
              className="form-label mb-1 text-secondary fw-bold"
              style={{ fontSize: '11px' }}
            >
              DISCIPLINA
            </label>
            <select
              id="disciplina-plano"
              className="form-select form-select-sm"
              value={novoPlano.disciplina}
              onChange={(e) =>
                setNovoPlano({ ...novoPlano, disciplina: e.target.value })
              }
            >
              {MATERIAS_DISPONIVEIS.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <button
              type="submit"
              className="btn btn-sm w-100 biblioteca-btn-primario py-2 rounded-3"
            >
              + Confirmar Criação
            </button>
          </div>
        </div>
      </form>

      {/* Grade de Cartões de Plano */}
      <div className="row g-4 mt-2">
        {planos.map((plano) => {
          const totalLivros = plano.livroIds?.length ?? 0;
          const totalApostilas = plano.apostilaIds?.length ?? 0;

          return (
            <div key={plano.id} className="col-12 col-md-6 col-xl-4">
              <div
                className={`card p-4 h-100 plano-estudo-card ${
                  plano.ativo ? 'is-ativo' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onExcluirPlano({
                      id: plano.id,
                      tipo: 'plano',
                      nome: plano.nome,
                    })
                  }
                  className="position-absolute plano-estudo-card-delete-btn p-1"
                  title="Excluir Plano"
                  aria-label={`Excluir plano ${plano.nome}`}
                >
                  ✕
                </button>

                <h6 className="fw-bold mb-3 text-dark fs-6 pe-4">
                  {plano.nome}
                </h6>

                <div className="d-flex gap-2 mb-4">
                  <span className="badge bg-secondary-subtle text-secondary-emphasis px-2 py-1 rounded">
                    ENEM
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary-emphasis px-2 py-1 rounded">
                    {plano.disciplina}
                  </span>
                </div>

                <div className="rounded-3 p-3 mb-4 bg-light border border-light-subtle">
                  <div className="d-flex gap-3 mb-2 fw-semibold text-dark small">
                    <span>
                      {totalLivros} Livro{totalLivros !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {totalApostilas} Conteúdo{totalApostilas !== 1 ? 's' : ''} web
                    </span>
                  </div>
                  <div className="d-flex gap-2" aria-hidden="true">
                    <span title="Livros">📘📙</span>
                    <span title="Conteúdo web">📄</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionadoId(plano.id)}
                    className="btn btn-link p-0 text-decoration-none fw-semibold text-success small"
                  >
                    Ver Plano Completo
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {planos.length === 0 && (
          <div className="col-12 text-center text-muted py-5">
            <p className="mb-0 fs-6">Nenhum plano de estudos encontrado.</p>
          </div>
        )}
      </div>

      {/* ================= Modal: Gerenciamento de Materiais do Plano ================= */}
      {planoAtivo && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setPlanoSelecionadoId(null)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog biblioteca-modal-dialog--lg p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plano-modal-titulo"
          >
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h3 id="plano-modal-titulo" className="h5 fw-bold mb-1 text-dark">
                  {planoAtivo.nome}
                </h3>
                <p className="text-muted mb-0 small">
                  {planoAtivo.disciplina} · {planoAtivo.livroIds?.length ?? 0} livros ·{' '}
                  {planoAtivo.apostilaIds?.length ?? 0} conteúdos web
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar"
                onClick={() => setPlanoSelecionadoId(null)}
              />
            </div>

            {/* Livros vinculados */}
            <h4 className="h6 fw-bold mt-4 text-dark">Livros do acervo</h4>
            {livros.length === 0 ? (
              <p className="text-muted small">
                Cadastre livros no acervo para adicioná-los a este plano.
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {livros.map((livro) => (
                  <label
                    key={livro.id}
                    className="d-flex align-items-center gap-2 border rounded-3 p-2 small cursor-pointer"
                  >
                    <input
                      className="form-check-input mt-0"
                      type="checkbox"
                      checked={planoAtivo.livroIds?.includes(livro.id) ?? false}
                      onChange={() =>
                        onAlternarMaterial(planoAtivo.id, 'livro', livro.id)
                      }
                    />
                    <span>
                      {livro.titulo}{' '}
                      <small className="text-muted">· {livro.autor}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Conteúdos web vinculados */}
            <h4 className="h6 fw-bold mt-4 text-dark">Conteúdos web</h4>
            {apostilas.length === 0 ? (
              <p className="text-muted small">
                Cadastre conteúdos web para adicioná-los a este plano.
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {apostilas.map((apostila) => (
                  <label
                    key={apostila.id}
                    className="d-flex align-items-center gap-2 border rounded-3 p-2 small cursor-pointer"
                  >
                    <input
                      className="form-check-input mt-0"
                      type="checkbox"
                      checked={
                        planoAtivo.apostilaIds?.includes(apostila.id) ?? false
                      }
                      onChange={() =>
                        onAlternarMaterial(planoAtivo.id, 'apostila', apostila.id)
                      }
                    />
                    <span>
                      {apostila.titulo}{' '}
                      <small className="text-muted">· {apostila.materia}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-sm biblioteca-btn-primario px-4 rounded-pill"
                onClick={() => setPlanoSelecionadoId(null)}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlanosAba;
