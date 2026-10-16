import { useMemo } from "react";

/**
 * Aba Turmas: Apresenta o CRUD de turmas (cards com ações de edição e vinculação)
 * e abaixo a relação nominal de todos os alunos matriculados na escola (sem filtros).
 */
const TurmasAba = ({
  turmas = [],
  matriculas = [],
  podeGerenciar = false,
  onCriarTurma,
  onEditarTurma,
  onVincularAluno,
  onExcluirTurma,
  onDesvincularAluno,
  loading = false,
}) => {
  // Mapa com a contagem de matrículas ativas por turma_id
  const contagemPorTurma = useMemo(() => {
    const mapa = {};
    matriculas.forEach((m) => {
      const turmaId = m.turma_id;
      mapa[turmaId] = (mapa[turmaId] || 0) + 1;
    });
    return mapa;
  }, [matriculas]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span className="text-muted small">Carregando turmas e matrículas...</span>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Cabeçalho da Seção com Ação de Nova Turma */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark fs-5">Quadro de Turmas</h4>
          <p className="text-muted mb-0 small">
            Gerenciamento de turmas, edição cadastral e vinculação de estudantes.
          </p>
        </div>

        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-sm turmas-btn-primario px-3 py-2 rounded-pill d-flex align-items-center gap-2"
            onClick={onCriarTurma}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Nova Turma</span>
          </button>
        )}
      </div>

      {/* 2. Grid de Cards de Cada Turma */}
      {turmas.length === 0 ? (
        <div className="text-center py-5 border rounded-4 bg-light mb-5">
          <i className="bi bi-collection fs-1 text-muted d-block mb-2"></i>
          <h6 className="fw-bold text-dark mb-1">Nenhuma turma cadastrada</h6>
          <p className="text-muted small mb-3">
            Comece cadastrando a primeira turma escolar para matricular estudantes e lançar notas.
          </p>
          {podeGerenciar && (
            <button
              type="button"
              className="btn btn-sm turmas-btn-primario px-4 rounded-pill"
              onClick={onCriarTurma}
            >
              Cadastrar Primeira Turma
            </button>
          )}
        </div>
      ) : (
        <div className="row g-3 mb-5">
          {turmas.map((turma) => {
            const totalAlunos = contagemPorTurma[turma.id_turma] || 0;
            const isAtiva = turma.status === "Ativa";

            return (
              <div key={turma.id_turma} className="col-12 col-md-6 col-xl-4">
                <div className="turma-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Header do Card */}
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <h5 className="fw-bold text-dark mb-0 fs-6">
                        {turma.nome_identificador}
                      </h5>
                      <span
                        className={`badge rounded-pill small ${
                          isAtiva
                            ? "bg-success-subtle text-success border border-success-subtle"
                            : "bg-secondary-subtle text-secondary border"
                        }`}
                      >
                        {turma.status || "Ativa"}
                      </span>
                    </div>

                    {/* Metadados da Turma */}
                    <div className="d-flex flex-wrap gap-2 text-muted small my-3">
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-sun me-1 text-warning"></i>
                        {turma.turno}
                      </span>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-calendar3 me-1 text-primary"></i>
                        Ano {turma.ano_letivo}
                      </span>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-people me-1 text-info"></i>
                        {totalAlunos} {totalAlunos === 1 ? "aluno" : "alunos"}
                      </span>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  {podeGerenciar && (
                    <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-2">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark rounded-pill fw-semibold px-3 py-1 d-flex align-items-center gap-1"
                          style={{ fontSize: "0.8rem" }}
                          onClick={() => onVincularAluno(turma)}
                          title="Confirmar matrículas de alunos integrados via Google Workspace"
                        >
                          <i className="bi bi-person-check-fill text-primary"></i>
                          <span>Confirmar Alunos</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border rounded-pill px-3 py-1 text-secondary"
                          style={{ fontSize: "0.8rem" }}
                          onClick={() => onEditarTurma(turma)}
                          title="Editar informações da turma"
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Editar
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                        onClick={() => onExcluirTurma(turma)}
                        title="Excluir turma"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Lista Nominal de Todos os Alunos Matriculados (Sem Filtros) */}
      <div className="turma-stat-card p-4">
        <div className="mb-4">
          <h4 className="fw-bold mb-1 text-dark fs-5">Todos os Alunos Matriculados</h4>
          <p className="text-muted mb-0 small">
            Relação completa de estudantes com matrícula ativa confirmada na escola ({matriculas.length} matriculados).
          </p>
        </div>

        {matriculas.length === 0 ? (
          <div className="text-center py-5 border rounded-3 bg-light">
            <i className="bi bi-people fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark mb-1">Nenhum aluno matriculado</h6>
            <p className="text-muted small mb-0">
              Utilize o botão "Confirmar Alunos" nos cards de turmas acima para homologar os estudantes integrados via Google Workspace.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small text-muted text-uppercase" style={{ fontSize: "0.75rem" }}>
                  <th scope="col" style={{ width: "40%" }}>Estudante</th>
                  <th scope="col">Turma Vinculada</th>
                  <th scope="col" className="text-center">Data de Matrícula</th>
                  <th scope="col" className="text-center">Status</th>
                  {podeGerenciar && <th scope="col" className="text-end">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {matriculas.map((mat) => {
                  const dataFormatada = mat.data_matricula
                    ? new Date(mat.data_matricula + "T00:00:00").toLocaleDateString("pt-BR")
                    : "—";

                  return (
                    <tr key={mat.id_matricula}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: "36px",
                              height: "36px",
                              backgroundColor: "var(--dashboard-pink-soft)",
                              color: "var(--dashboard-pink)",
                              fontSize: "0.85rem",
                            }}
                          >
                            {(mat.aluno?.name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="d-block text-dark small">{mat.aluno?.name || "Estudante"}</strong>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {mat.aluno?.email}
                              </small>
                              <span
                                className="badge bg-light text-secondary border d-inline-flex align-items-center gap-1"
                                style={{ fontSize: "0.62rem" }}
                              >
                                <i className="bi bi-google text-primary" style={{ fontSize: "0.6rem" }}></i>
                                Institucional
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">
                          {mat.turma?.nome_identificador || `Turma #${mat.turma_id}`}
                        </span>
                      </td>
                      <td className="text-center">
                        <small className="text-secondary fw-semibold">{dataFormatada}</small>
                      </td>
                      <td className="text-center">
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle small">
                          {mat.status_matricula || "Ativo"}
                        </span>
                      </td>
                      {podeGerenciar && (
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-3 rounded-pill small"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => onDesvincularAluno(mat)}
                            title="Desvincular aluno da turma"
                          >
                            <i className="bi bi-person-dash me-1"></i>
                            Desvincular
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurmasAba;
