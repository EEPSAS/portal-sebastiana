import { useMemo } from "react";

/**
 * Aba Notas: Apresenta cards clicáveis com a média geral de cada turma,
 * permitindo alternar a listagem de notas e disparar o cadastro via CSV pelo Especialista.
 */
const NotasAba = ({
  resumoGeral = [],
  turmaSelecionadaId = "",
  onSelecionarTurma,
  notas = [],
  periodoFiltro = "",
  onPeriodoFiltroChange,
  termoBusca = "",
  onTermoBuscaChange,
  podeGerenciar = false,
  onAbrirImportarNotas,
  loadingNotas = false,
  trimestreAtual = "",
}) => {
  // Turma atualmente selecionada
  const turmaSelecionada = useMemo(
    () => resumoGeral.find((t) => String(t.id_turma) === String(turmaSelecionadaId)) || null,
    [resumoGeral, turmaSelecionadaId]
  );

  // Filtra as notas pelo campo de busca
  const notasFiltradas = useMemo(() => {
    const termo = (termoBusca || "").trim().toLowerCase();
    if (!termo) return notas;

    return notas.filter((n) => {
      const alunoNome = (n.aluno?.name || "").toLowerCase();
      const discNome = (n.disciplina?.nome || "").toLowerCase();
      const periodo = (n.periodo_letivo || "").toLowerCase();
      return alunoNome.includes(termo) || discNome.includes(termo) || periodo.includes(termo);
    });
  }, [notas, termoBusca]);

  return (
    <div>
      {/* 1. Cabeçalho com Ação de Importar CSV */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark fs-5">Aproveitamento e Notas</h4>
          <p className="text-muted mb-0 small">
            Selecione uma turma para consultar o boletim consolidado ou cadastrar notas via planilha CSV.
          </p>
        </div>

        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-sm turmas-btn-primario px-3 py-2 rounded-pill d-flex align-items-center gap-2"
            onClick={onAbrirImportarNotas}
            disabled={!turmaSelecionada}
          >
            <i className="bi bi-file-earmark-arrow-up-fill"></i>
            <span>Cadastrar Notas (CSV)</span>
          </button>
        )}
      </div>

      {/* 2. Cards com a Média Geral por Turma (Clicáveis) */}
      <div className="mb-4">
        <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: "0.75rem" }}>
          Médias Gerais por Turma (clique para selecionar)
        </small>

        <div className="row g-3">
          {resumoGeral.map((turma) => {
            const isSelecionada = String(turma.id_turma) === String(turmaSelecionadaId);
            const mediaNum = Number(turma.media_geral || 0);
            const temNota = mediaNum > 0;

            return (
              <div key={turma.id_turma} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div
                  className={`turma-card p-3 h-100 ${isSelecionada ? "is-selected" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelecionarTurma(String(turma.id_turma))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelecionarTurma(String(turma.id_turma));
                    }
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong className="d-block text-dark small text-truncate" style={{ maxWidth: "160px" }}>
                        {turma.nome_identificador}
                      </strong>
                      <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {turma.turno} • {turma.total_alunos || 0} alunos
                      </small>
                    </div>

                    <div
                      className="rounded-3 px-2 py-1 text-center"
                      style={{
                        backgroundColor: isSelecionada ? "#fce7f3" : "#f8fafc",
                        border: isSelecionada ? "1px solid #e6007e" : "1px solid #e2e8f0",
                      }}
                    >
                      <span
                        className="fw-bold d-block"
                        style={{
                          fontSize: "1rem",
                          color: isSelecionada ? "#e6007e" : temNota ? "#0f172a" : "#94a3b8",
                        }}
                      >
                        {temNota ? mediaNum.toFixed(1) : "—"}
                      </span>
                      <small style={{ fontSize: "0.65rem", color: "#64748b" }}>Média</small>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                    <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                      {turma.total_avaliados || 0} avaliados
                    </small>
                    {isSelecionada && (
                      <span className="badge rounded-pill" style={{ backgroundColor: "#e6007e", fontSize: "0.65rem" }}>
                        Ativa
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tabela de Notas da Turma Selecionada */}
      <div className="turma-stat-card p-4">
        {/* Barra de Filtros e Busca */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-0 text-dark fs-6">
              Notas da Turma:{" "}
              <span style={{ color: "#e6007e" }}>
                {turmaSelecionada?.nome_identificador || "Selecione uma turma"}
              </span>
            </h4>
            <small className="text-muted">
              Mostrando {notasFiltradas.length} de {notas.length} notas lançadas
              {periodoFiltro ? ` (${periodoFiltro})` : ""}.
            </small>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Filtro de Período */}
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={periodoFiltro}
              onChange={(e) => onPeriodoFiltroChange(e.target.value)}
              aria-label="Filtrar por período letivo"
            >
              <option value="">Todos os Períodos</option>
              <option value="1º Trimestre">
                1º Trimestre{trimestreAtual === "1º Trimestre" ? " (Atual)" : ""}
              </option>
              <option value="2º Trimestre">
                2º Trimestre{trimestreAtual === "2º Trimestre" ? " (Atual)" : ""}
              </option>
              <option value="3º Trimestre">
                3º Trimestre{trimestreAtual === "3º Trimestre" ? " (Atual)" : ""}
              </option>
              <option value="1º Bimestre">1º Bimestre</option>
              <option value="2º Bimestre">2º Bimestre</option>
              <option value="3º Bimestre">3º Bimestre</option>
              <option value="4º Bimestre">4º Bimestre</option>
            </select>

            {/* Campo de Pesquisa */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4"
                placeholder="Buscar aluno ou matéria..."
                value={termoBusca}
                onChange={(e) => onTermoBuscaChange(e.target.value)}
                style={{ width: "220px" }}
              />
              <i
                className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                style={{ fontSize: "0.8rem" }}
              ></i>
            </div>
          </div>
        </div>

        {/* Listagem */}
        {loadingNotas ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            <span className="text-muted small">Carregando notas da turma...</span>
          </div>
        ) : notasFiltradas.length === 0 ? (
          <div className="text-center py-5 border rounded-3 bg-light">
            <i className="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark mb-1">Nenhuma nota encontrada</h6>
            <p className="text-muted small mb-3">
              {termoBusca || periodoFiltro
                ? `Nenhum resultado corresponde aos filtros aplicados${
                    periodoFiltro ? ` (${periodoFiltro})` : ""
                  }.`
                : "Esta turma ainda não possui notas lançadas no diário."}
            </p>
            <div className="d-flex justify-content-center gap-2">
              {/* Facilitador para exibir todos os períodos caso o trimestre padrão ainda não tenha notas */}
              {periodoFiltro && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3 py-1 rounded-pill"
                  onClick={() => onPeriodoFiltroChange("")}
                >
                  <i className="bi bi-calendar3 me-1"></i> Ver todos os períodos
                </button>
              )}
              {podeGerenciar && !termoBusca && (
                <button
                  type="button"
                  className="btn btn-sm turmas-btn-primario px-3 py-1 rounded-pill"
                  onClick={onAbrirImportarNotas}
                >
                  <i className="bi bi-file-earmark-plus me-1"></i> Cadastrar Notas via CSV
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small text-muted text-uppercase" style={{ fontSize: "0.75rem" }}>
                  <th scope="col">Aluno</th>
                  <th scope="col">Disciplina</th>
                  <th scope="col">Período Letivo</th>
                  <th scope="col" className="text-center">Nota</th>
                  <th scope="col" className="text-center">Situação</th>
                  <th scope="col" className="text-end">Data Registro</th>
                </tr>
              </thead>
              <tbody>
                {notasFiltradas.map((nota) => {
                  const valor = Number(nota.valor_nota || 0);
                  const valorMax = Number(nota.valor_maximo || 10);
                  const isAprovado = valor >= valorMax * 0.6;

                  return (
                    <tr key={nota.id_nota}>
                      <td>
                        <strong className="d-block text-dark small">{nota.aluno?.name || "Estudante"}</strong>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {nota.aluno?.email}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border fw-semibold">
                          {nota.disciplina?.nome || "Geral"}
                        </span>
                      </td>
                      <td>
                        <small className="text-secondary fw-semibold">{nota.periodo_letivo}</small>
                      </td>
                      <td className="text-center">
                        <span className={`fw-bold ${isAprovado ? "text-dark" : "text-danger"}`}>
                          {valor.toFixed(1)}
                        </span>
                        <small className="text-muted"> / {valorMax.toFixed(0)}</small>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge rounded-pill small ${
                            isAprovado
                              ? "bg-success-subtle text-success border border-success-subtle"
                              : "bg-danger-subtle text-danger border border-danger-subtle"
                          }`}
                        >
                          {isAprovado ? "Aproveitamento Adequado" : "Abaixo da Média"}
                        </span>
                      </td>
                      <td className="text-end">
                        <small className="text-muted">
                          {nota.data_registro
                            ? new Date(nota.data_registro + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </small>
                      </td>
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

export default NotasAba;
