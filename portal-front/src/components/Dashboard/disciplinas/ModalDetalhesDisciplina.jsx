/**
 * ModalDetalhesDisciplina.jsx - Modal de Consulta Pedagógica da Disciplina
 *
 * Papel Didático:
 * Exibe a ementa, habilidades BNCC e objetivos (geral e específico) da disciplina.
 */

import { formatarDisciplinaCiclo } from "../../../utils/formatters";

export default function ModalDetalhesDisciplina({ disciplina, onFechar }) {
  if (!disciplina) return null;

  const aulasSem =
    disciplina.aulas_semanais ||
    Math.max(1, Math.round((disciplina.carga_horaria_anual || 160) / 40));
  const totalAulas =
    disciplina.total_aulas_anuais ||
    disciplina.carga_horaria_anual ||
    aulasSem * 40;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom-0 pb-0">
            <div>
              <h2 className="modal-title h5 fw-bold text-primary mb-1">
                {formatarDisciplinaCiclo(disciplina)}
              </h2>
              <span className="badge bg-primary-subtle text-primary rounded-pill">
                {aulasSem} aulas semanais • {totalAulas} aulas anuais (40 semanas)
              </span>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fechar"
              onClick={onFechar}
            ></button>
          </div>

          <div className="modal-body py-3 small">
            {/* Ciclos vinculados */}
            {Array.isArray(disciplina.ciclos) && disciplina.ciclos.length > 0 && (
              <div className="mb-3">
                <strong className="d-block text-dark mb-1">Ciclos Vinculados:</strong>
                <div className="d-flex flex-wrap gap-1">
                  {disciplina.ciclos.map((c) => (
                    <span
                      key={c.id_ciclo}
                      className="badge bg-secondary-subtle text-dark rounded-pill"
                    >
                      <i className="bi bi-diagram-3 me-1"></i>
                      {c.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Docentes */}
            {Array.isArray(disciplina.professores) && disciplina.professores.length > 0 && (
              <div className="mb-3">
                <strong className="d-block text-dark mb-1">Docente(s) Responsável(is):</strong>
                <p className="text-secondary mb-0">
                  <i className="bi bi-person-badge me-1 text-primary"></i>
                  {disciplina.professores.map((p) => p.name).join(", ")}
                </p>
              </div>
            )}

            <div className="mb-3">
              <strong className="d-block text-dark mb-1">Ementa:</strong>
              <p className="text-muted mb-0">{disciplina.ementa || "Não informada."}</p>
            </div>
            <div className="mb-3">
              <strong className="d-block text-dark mb-1">Habilidades BNCC:</strong>
              <p className="text-muted mb-0">{disciplina.habilidades_bncc || "Não informadas."}</p>
            </div>
            <div className="mb-3">
              <strong className="d-block text-dark mb-1">Objetivo Geral:</strong>
              <p className="text-muted mb-0">{disciplina.objetivo_geral || "Não informado."}</p>
            </div>
            <div>
              <strong className="d-block text-dark mb-1">Objetivo Específico:</strong>
              <p className="text-muted mb-0">{disciplina.objetivo_especifico || "Não informado."}</p>
            </div>
          </div>

          <div className="modal-footer border-top-0 pt-0">
            <button
              type="button"
              className="btn btn-secondary btn-sm rounded-pill px-4"
              onClick={onFechar}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
