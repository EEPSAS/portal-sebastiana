/**
 * ConteudoWebAba.jsx - Aba Coesa de Gestão de Conteúdos Digitais e Apostilas
 *
 * Papel Didático:
 * Centraliza o acervo de materiais pedagógicos digitais (resumos, apostilas, links):
 * - Grid responsivo de cartões com tags temáticas e links de acesso;
 * - Modal controlado para cadastro e edição de materiais web com preenchimento seguro.
 */

import { useState } from 'react';

const MATERIAS_PADRAO = [
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

const TIPOS_MATERIAL = [
  'Apostila',
  'Resumo',
  'Lista de exercícios',
  'Manual',
  'Texto',
];

const ESTADO_MATERIAL_INICIAL = {
  id: null,
  titulo: '',
  materia: 'Matemática',
  descricao: '',
  url: '',
  topico: '',
  tipo: 'Apostila',
  nivel: '',
  autor: '',
  corBadge: '#e0f2fe',
  corTexto: '#0284c7',
};

const ConteudoWebAba = ({
  apostilas = [],
  onSalvarApostila,
  onExcluirApostila,
}) => {
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [formApostila, setFormApostila] = useState(ESTADO_MATERIAL_INICIAL);

  const abrirNovoMaterial = () => {
    setFormApostila(ESTADO_MATERIAL_INICIAL);
    setModalFormAberto(true);
  };

  const abrirEdicaoMaterial = (apostila) => {
    setFormApostila({ ...apostila });
    setModalFormAberto(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formApostila.titulo.trim()) return;

    onSalvarApostila(formApostila);
    setModalFormAberto(false);
  };

  return (
    <section aria-label="Conteúdo Web e Apostilas">
      <div className="d-flex justify-content-end mb-4">
        <button
          type="button"
          onClick={abrirNovoMaterial}
          className="btn rounded-pill px-4 py-2 biblioteca-btn-primario shadow-sm small"
        >
          + Cadastrar conteúdo web
        </button>
      </div>

      {/* Grade de Cartões de Conteúdo Web */}
      <div className="row g-3">
        {apostilas.map((apostila) => {
          const etiquetas = [
            apostila.materia,
            apostila.tipo,
            apostila.nivel,
          ].filter(Boolean);
          const rodape = [apostila.topico, apostila.autor]
            .filter(Boolean)
            .join(' · ');

          return (
            <div key={apostila.id} className="col-12 col-lg-6">
              <article className="h-100 p-3 rounded-4 border shadow-sm bg-white d-flex gap-3">
                <div
                  className="material-web-icon"
                  style={{
                    backgroundColor: apostila.corBadge || '#e0f2fe',
                    color: apostila.corTexto || '#0284c7',
                  }}
                  aria-hidden="true"
                >
                  📄
                </div>

                <div className="flex-grow-1 min-w-0">
                  <h6 className="fw-bold mb-1 fs-6 text-dark">
                    {apostila.titulo}
                  </h6>

                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {etiquetas.map((etiqueta) => (
                      <span
                        key={etiqueta}
                        className="badge bg-light text-dark border-0 small"
                        style={{ fontSize: '10px' }}
                      >
                        {etiqueta}
                      </span>
                    ))}
                  </div>

                  <p className="text-muted mb-1 small text-truncate-2">
                    {apostila.descricao || 'Sem descrição cadastrada.'}
                  </p>

                  {rodape && (
                    <small className="text-secondary d-block">{rodape}</small>
                  )}

                  {apostila.url && (
                    <a
                      href={apostila.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-inline-block mt-2 small text-primary fw-semibold"
                    >
                      Acessar conteúdo web ↗
                    </a>
                  )}
                </div>

                <div className="d-flex flex-column gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirEdicaoMaterial(apostila)}
                    className="btn btn-sm btn-outline-primary"
                    aria-label={`Editar ${apostila.titulo}`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onExcluirApostila({
                        id: apostila.id,
                        tipo: 'apostila',
                        nome: apostila.titulo,
                      })
                    }
                    className="btn btn-sm btn-outline-danger"
                    aria-label={`Excluir ${apostila.titulo}`}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            </div>
          );
        })}

        {apostilas.length === 0 && (
          <div className="col-12 text-center text-muted py-5">
            <p className="mb-0 fs-6">Nenhum conteúdo web encontrado.</p>
          </div>
        )}
      </div>

      {/* ================= Modal: Cadastro / Edição de Material ================= */}
      {modalFormAberto && (
        <div
          className="biblioteca-modal-overlay"
          onClick={() => setModalFormAberto(false)}
          role="presentation"
        >
          <div
            className="biblioteca-modal-dialog p-4 position-relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-apostila-titulo"
          >
            <button
              type="button"
              onClick={() => setModalFormAberto(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Fechar formulário"
            />

            <h3 id="form-apostila-titulo" className="h5 fw-bold mb-3 text-dark">
              {formApostila.id ? 'Editar material' : 'Cadastrar material'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="apostila-titulo">
                  Título
                </label>
                <input
                  id="apostila-titulo"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex: Resumo de Genética"
                  value={formApostila.titulo}
                  onChange={(e) =>
                    setFormApostila((prev) => ({
                      ...prev,
                      titulo: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="apostila-url">
                  Link do conteúdo web
                </label>
                <input
                  id="apostila-url"
                  type="url"
                  className="form-control form-control-sm"
                  value={formApostila.url ?? ''}
                  onChange={(e) =>
                    setFormApostila((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  maxLength={2048}
                  placeholder="https://..."
                  required={!formApostila.id}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="apostila-materia">
                    Disciplina
                  </label>
                  <select
                    id="apostila-materia"
                    className="form-select form-select-sm"
                    value={formApostila.materia}
                    onChange={(e) =>
                      setFormApostila((prev) => ({
                        ...prev,
                        materia: e.target.value,
                      }))
                    }
                  >
                    {MATERIAS_PADRAO.map((materia) => (
                      <option key={materia} value={materia}>
                        {materia}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="apostila-tipo">
                    Tipo de material
                  </label>
                  <select
                    id="apostila-tipo"
                    className="form-select form-select-sm"
                    value={formApostila.tipo}
                    onChange={(e) =>
                      setFormApostila((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                  >
                    {TIPOS_MATERIAL.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="apostila-descricao">
                  Descrição
                </label>
                <textarea
                  id="apostila-descricao"
                  className="form-control form-control-sm"
                  rows="3"
                  maxLength={500}
                  placeholder="Breve descrição do conteúdo..."
                  value={formApostila.descricao}
                  onChange={(e) =>
                    setFormApostila((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="apostila-topico">
                    Assunto ou tópico
                  </label>
                  <input
                    id="apostila-topico"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ex: Mitose e Meiose"
                    value={formApostila.topico}
                    onChange={(e) =>
                      setFormApostila((prev) => ({
                        ...prev,
                        topico: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="apostila-nivel">
                    Nível ou ano
                  </label>
                  <input
                    id="apostila-nivel"
                    type="text"
                    className="form-control form-control-sm"
                    value={formApostila.nivel}
                    onChange={(e) =>
                      setFormApostila((prev) => ({
                        ...prev,
                        nivel: e.target.value,
                      }))
                    }
                    placeholder="Ex.: 1º ano, ENEM"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold" htmlFor="apostila-autor">
                  Autor ou origem
                </label>
                <input
                  id="apostila-autor"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex.: Equipe Pedagógica"
                  value={formApostila.autor}
                  onChange={(e) =>
                    setFormApostila((prev) => ({
                      ...prev,
                      autor: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
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
                  Salvar material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default ConteudoWebAba;
