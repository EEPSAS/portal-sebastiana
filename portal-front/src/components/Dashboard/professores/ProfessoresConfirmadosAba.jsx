/**
 * ProfessoresConfirmadosAba.jsx - Gestão de Professores Ativos na Escola (Módulo 5.6)
 *
 * Papel Didático:
 * Renderiza os docentes ativos na instituição com suas disciplinas e turmas associadas:
 * 1. Badges visuais com as disciplinas curriculares lecionadas;
 * 2. Contador de turmas com regência do professor;
 * 3. Botão para acionar o modal de gerenciamento de vínculos (`ModalVincularDisciplina`).
 */

import { formatarDisciplinaCiclo } from "../../../utils/formatters";

export default function ProfessoresConfirmadosAba({
  professoresConfirmados,
  onAbrirModalVincular,
}) {
  if (professoresConfirmados.length === 0) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
        <i className="bi bi-people text-secondary fs-1 mb-3"></i>
        <h3 className="h5 fw-bold text-dark mb-1">Nenhum professor confirmado</h3>
        <p className="small mb-0">Nenhum docente ativo encontrado com o termo pesquisado.</p>
      </div>
    );
  }

  return (
    <div className="row g-2">
      {professoresConfirmados.map((prof) => (
        <div key={prof.id} className="col-12 col-xl-6">
          <div
            className="card professor-card border shadow-xs rounded-3 p-3 bg-white h-100 d-flex flex-column justify-content-between"
            style={{ borderLeft: "4px solid #10b981" }}
          >
            <div>
              <div className="d-flex align-items-start gap-3 mb-3">
                {/* Avatar */}
                <div
                  className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: "52px", height: "52px", overflow: "hidden" }}
                >
                  {prof.avatar ? (
                    <img
                      src={prof.avatar}
                      alt={prof.name}
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <i className="bi bi-person-fill fs-3"></i>
                  )}
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h4 className="h6 fw-bold text-dark mb-0">{prof.name}</h4>
                    <span className="badge badge-confirmado px-2 py-1 rounded-pill small">
                      Confirmado
                    </span>
                  </div>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-envelope me-1"></i>
                    {prof.email}
                  </p>
                </div>
              </div>

              {/* Disciplinas atribuídas */}
              <div className="mb-3">
                <span className="text-secondary fw-semibold small d-block mb-1">
                  Disciplinas Atribuídas ({prof.disciplinas?.length || 0}):
                </span>

                {(!prof.disciplinas || prof.disciplinas.length === 0) ? (
                  <span className="text-muted small fst-italic">
                    Nenhuma disciplina vinculada ainda.
                  </span>
                ) : (
                  <div className="d-flex flex-wrap gap-1">
                    {prof.disciplinas.map((disc) => (
                      <span key={disc.id_disciplina} className="disciplina-tag">
                        <i className="bi bi-journal-bookmark text-primary"></i>
                        {formatarDisciplinaCiclo(disc)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do card: Resumo de turmas e Ação */}
            <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-2">
              <span className="text-muted small">
                <i className="bi bi-people-fill me-1 text-secondary"></i>
                {prof.total_turmas || 0} turma(s) com regência
              </span>

              <button
                type="button"
                className="btn btn-primary btn-sm px-3 fw-semibold rounded-3"
                onClick={() => onAbrirModalVincular(prof)}
              >
                <i className="bi bi-gear-fill me-1"></i>
                Gerenciar Disciplinas
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
