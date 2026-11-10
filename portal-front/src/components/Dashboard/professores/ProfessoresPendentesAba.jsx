/**
 * ProfessoresPendentesAba.jsx - Gestão de Professores Aguardando Validação (Módulo 5.6)
 *
 * Papel Didático:
 * Renderiza os docentes pendentes de confirmação institucional:
 * 1. Exige o vínculo obrigatório a pelo menos uma disciplina antes da aprovação (Item 2.3.2);
 * 2. Utiliza o `<SeletorDisciplinas />` para escolha dinâmica das matérias;
 * 3. Botões de ação para Aprovação (com spinner) e Recusa.
 */

import SeletorDisciplinas from "./SeletorDisciplinas";

export default function ProfessoresPendentesAba({
  professoresPendentes,
  disciplinasCatalogo,
  disciplinasPendentesMap,
  processandoId,
  onToggleDisciplinaPendente,
  onConfirmar,
  onRecusar,
}) {
  if (professoresPendentes.length === 0) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
        <i className="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
        <h3 className="h5 fw-bold text-dark mb-1">Nenhum professor pendente de confirmação</h3>
        <p className="small mb-0">
          Todos os professores cadastrados já foram avaliados e confirmados na instituição.
        </p>
      </div>
    );
  }

  return (
    <div className="row g-2">
      {professoresPendentes.map((prof) => {
        const selecionadas = disciplinasPendentesMap[prof.id] || [];

        return (
          <div key={prof.id} className="col-12 col-lg-6">
            <div
              className="card professor-card border shadow-xs rounded-3 p-3 bg-white h-100"
              style={{ borderLeft: "4px solid #f59e0b" }}
            >
              <div className="d-flex align-items-start gap-3">
                {/* Avatar do professor */}
                <div
                  className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center flex-shrink-0"
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
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <h4 className="h6 fw-bold text-dark mb-0">{prof.name}</h4>
                    <span className="badge badge-pendente px-2 py-1 rounded-pill small">
                      Aguardando Validação
                    </span>
                  </div>

                  <p className="text-muted small mb-2">
                    <i className="bi bi-envelope me-1"></i>
                    {prof.email}
                  </p>

                  {/* Seleção Obrigatória de Disciplinas para Aprovação */}
                  <div className="border rounded-3 p-3 bg-light mb-3">
                    <label className="form-label small fw-bold text-dark mb-2 d-block">
                      <i className="bi bi-journal-bookmark-fill text-primary me-1"></i>
                      Vincular Disciplina(s) para Aprovar Acesso (Obrigatório):
                    </label>
                    {disciplinasCatalogo.length === 0 ? (
                      <p className="text-muted small mb-0">
                        Nenhuma disciplina cadastrada. Cadastre em Acadêmico &gt; Disciplinas.
                      </p>
                    ) : (
                      <SeletorDisciplinas
                        idPrefixo={`prof-${prof.id}`}
                        disciplinas={disciplinasCatalogo}
                        selecionadas={selecionadas}
                        onToggle={(idDisciplina) =>
                          onToggleDisciplinaPendente(prof.id, idDisciplina)
                        }
                      />
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3 fw-semibold rounded-3"
                      onClick={() => onConfirmar(prof)}
                      disabled={processandoId === prof.id || selecionadas.length === 0}
                    >
                      {processandoId === prof.id ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      ) : (
                        <i className="bi bi-check-lg me-1"></i>
                      )}
                      Aprovar e Vincular ({selecionadas.length})
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm px-3 fw-semibold rounded-3"
                      onClick={() => onRecusar(prof.id)}
                      disabled={processandoId === prof.id}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
