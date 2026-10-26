/**
 * ModalVincularDisciplina.jsx - Modal de Atribuição de Disciplinas ao Professor
 *
 * Papel Didático:
 * Permite ao Especialista Pedagógico vincular uma disciplina curricular ao docente.
 * Conforme a regra de negócio do projeto, a matéria atribuída sincroniza automaticamente
 * a titularidade do professor nas turmas ativas da instituição.
 */

import { useState } from "react";

const ModalVincularDisciplina = ({
  professor,
  disciplinasCatalogo,
  onClose,
  onVincular,
  onDesvincular,
}) => {
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);
  const [erro, setErro] = useState("");

  if (!professor) return null;

  // Filtra as disciplinas que o professor ainda NÃO possui vinculadas
  const idsJaVinculados = new Set((professor.disciplinas || []).map((d) => d.id_disciplina));
  const disciplinasDisponiveis = (disciplinasCatalogo || []).filter(
    (d) => !idsJaVinculados.has(d.id_disciplina)
  );

  const handleVincular = async (e) => {
    e.preventDefault();
    if (!disciplinaSelecionadaId) return;

    setSalvando(true);
    setErro("");

    try {
      await onVincular(professor.id, Number(disciplinaSelecionadaId));
      setDisciplinaSelecionadaId("");
    } catch (err) {
      setErro(err.message || "Não foi possível vincular a disciplina.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDesvincular = async (disciplinaId) => {
    setRemovendoId(disciplinaId);
    setErro("");

    try {
      await onDesvincular(professor.id, disciplinaId);
    } catch (err) {
      setErro(err.message || "Não foi possível remover a disciplina.");
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          {/* Cabeçalho do modal */}
          <div className="modal-header border-bottom-0 pb-0">
            <div>
              <h2 className="modal-title h5 fw-bold text-dark mb-0">Disciplinas do Professor</h2>
              <p className="text-muted small mb-0">{professor.name}</p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onClose}
              disabled={salvando || removendoId !== null}
            ></button>
          </div>

          <div className="modal-body py-4">
            {erro && (
              <div className="alert alert-danger rounded-3 small py-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {erro}
              </div>
            )}

            {/* Seção 1: Disciplinas Atuais */}
            <h6 className="fw-semibold text-secondary small text-uppercase mb-2">
              Matérias Atribuídas ({professor.disciplinas?.length || 0})
            </h6>

            {(!professor.disciplinas || professor.disciplinas.length === 0) ? (
              <div className="alert alert-light border text-center small text-muted py-3 mb-4 rounded-3">
                Nenhuma disciplina atribuída a este professor no momento.
              </div>
            ) : (
              <ul className="list-group list-group-flush mb-4 border rounded-3 overflow-hidden">
                {professor.disciplinas.map((disc) => (
                  <li
                    key={disc.id_disciplina}
                    className="list-group-item d-flex align-items-center justify-content-between py-2 px-3"
                  >
                    <div>
                      <span className="fw-semibold text-dark">{disc.nome}</span>
                      {disc.carga_horaria_anual && (
                        <span className="text-muted small ms-2">
                          ({disc.carga_horaria_anual}h anuais)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm border-0 rounded-circle"
                      title="Desvincular matéria"
                      onClick={() => handleDesvincular(disc.id_disciplina)}
                      disabled={removendoId === disc.id_disciplina || salvando}
                    >
                      {removendoId === disc.id_disciplina ? (
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      ) : (
                        <i className="bi bi-trash3"></i>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Seção 2: Formulário para Adicionar Nova Matéria */}
            <form onSubmit={handleVincular} className="border-top pt-3">
              <label htmlFor="select-disciplina" className="form-label fw-semibold small text-dark">
                Atribuir Nova Disciplina Curricular:
              </label>

              <div className="d-flex gap-2">
                <select
                  id="select-disciplina"
                  className="form-select form-select-sm rounded-3"
                  value={disciplinaSelecionadaId}
                  onChange={(e) => setDisciplinaSelecionadaId(e.target.value)}
                  disabled={salvando || disciplinasDisponiveis.length === 0}
                  required
                >
                  <option value="">
                    {disciplinasDisponiveis.length === 0
                      ? "Todas as matérias já vinculadas"
                      : "Selecione uma disciplina..."}
                  </option>
                  {disciplinasDisponiveis.map((disc) => (
                    <option key={disc.id_disciplina} value={disc.id_disciplina}>
                      {disc.nome}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-3 fw-semibold text-nowrap rounded-3"
                  disabled={salvando || !disciplinaSelecionadaId}
                >
                  {salvando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-lg me-1"></i>
                      Vincular
                    </>
                  )}
                </button>
              </div>
              <small className="text-muted d-block mt-2" style={{ fontSize: "0.775rem" }}>
                * Ao vincular a disciplina, o docente assumirá a matéria em todas as turmas ativas da instituição.
              </small>
            </form>
          </div>

          <div className="modal-footer border-top-0 pt-0">
            <button
              type="button"
              className="btn btn-light btn-sm fw-semibold rounded-3 px-3"
              onClick={onClose}
              disabled={salvando || removendoId !== null}
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVincularDisciplina;
