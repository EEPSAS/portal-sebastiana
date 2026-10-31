import { useEffect, useState } from "react";
import { formatarDisciplinaCiclo } from "../../../utils/formatters";
import { obterPeriodoLetivoAtivo } from "../../../services/periodosLetivosService";

/**
 * NotasAba.jsx - Gestão e Consulta de Notas e Diário Escolar por Turma
 *
 * Papel Didático:
 * 1. Apresenta cards das turmas com média geral para alternância rápida.
 * 2. Disponibiliza botões de ação para o Especialista/Adm (Importação e Exclusão de dados CSV).
 * 3. Implementa filtro individual por estudante para não sobrecarregar a listagem de uma só vez.
 * 4. Fornece conexão direta com a visualização do Boletim Escolar individual do aluno selecionado.
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
  onAbrirExcluirDadosCsv,
  loadingNotas = false,
  trimestreAtual = "",
  alunosTurma = [],
  alunoFiltroId = "",
  onAlunoFiltroChange,
  onAbrirBoletimAluno,
  divisoesPeriodo = [],
}) => {
  const [periodoAtivoLocal, setPeriodoAtivoLocal] = useState(null);

  useEffect(() => {
    let ativo = true;
    obterPeriodoLetivoAtivo()
      .then((p) => {
        if (ativo && p) setPeriodoAtivoLocal(p);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const divisoesParaExibir =
    divisoesPeriodo.length > 0
      ? divisoesPeriodo
      : periodoAtivoLocal?.divisoes || [];
  // Localiza o objeto da turma atualmente ativa nos cards
  const turmaSelecionada =
    resumoGeral.find((t) => String(t.id_turma) === String(turmaSelecionadaId)) || null;

  // Localiza os dados do aluno filtrado no dropdown
  const alunoSelecionado =
    alunosTurma.find((a) => String(a.id) === String(alunoFiltroId)) || null;

  // Filtra as notas pelo campo de busca textual (disciplina ou período)
  const termoNormalizado = (termoBusca || "").trim().toLowerCase();
  const notasFiltradas = !termoNormalizado
    ? notas
    : notas.filter((n) => {
        const alunoNome = (n.aluno?.name || "").toLowerCase();
        const discNome = (n.disciplina?.nome || "").toLowerCase();
        const periodo = (n.periodo_letivo || "").toLowerCase();
        return (
          alunoNome.includes(termoNormalizado) ||
          discNome.includes(termoNormalizado) ||
          periodo.includes(termoNormalizado)
        );
      });

  return (
    <div>
      {/* 1. Cabeçalho com Apresentação da Seção */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark fs-5">Aproveitamento e Notas</h4>
          <p className="text-muted mb-0 small">
            Selecione uma turma para consultar o diário escolar consolidado ou gerenciar lançamentos via CSV da turma.
          </p>
        </div>
      </div>

      {/* 2. Cards com a Média Geral por Turma (Clicáveis) */}
      <div className="mb-4">
        <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: "0.75rem" }}>
          Médias Gerais por Turma (clique para alternar a turma ativa)
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
                        backgroundColor: isSelecionada ? "var(--dashboard-pink-soft)" : "var(--dashboard-gray-soft)",
                        border: isSelecionada ? "1px solid var(--dashboard-pink)" : "1px solid var(--dashboard-gray-border)",
                      }}
                    >
                      <span
                        className="fw-bold d-block"
                        style={{
                          fontSize: "1rem",
                          color: isSelecionada ? "var(--dashboard-pink)" : temNota ? "var(--dashboard-navy)" : "var(--dashboard-gray)",
                        }}
                      >
                        {temNota ? mediaNum.toFixed(1) : "—"}
                      </span>
                      <small style={{ fontSize: "0.65rem", color: "var(--dashboard-ink-muted)" }}>Média</small>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                    <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                      {turma.total_avaliados || 0} avaliados
                    </small>
                    {isSelecionada && (
                      <span className="badge rounded-pill" style={{ backgroundColor: "var(--dashboard-pink)", fontSize: "0.65rem" }}>
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

      {/* 3. Painel de Consulta e Diário Escolar da Turma */}
      <div className="turma-stat-card p-2 p-md-3">
        {/* Barra de Filtros: Filtro por Aluno (Evita sobrecarga) + Período + Busca */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h4 className="fw-bold mb-0 text-dark fs-6">
                Notas da Turma:{" "}
                <span style={{ color: "var(--dashboard-pink)" }}>
                  {turmaSelecionada?.nome_identificador || "Selecione uma turma"}
                </span>
              </h4>
              {podeGerenciar && turmaSelecionada && (
                <div className="d-flex align-items-center gap-2 ms-sm-2">
                  <button
                    type="button"
                    className="btn btn-sm turmas-btn-primario px-3 py-1 rounded-pill d-flex align-items-center gap-1"
                    onClick={() => onAbrirImportarNotas(turmaSelecionada)}
                    title={`Cadastrar notas via CSV para a turma ${turmaSelecionada.nome_identificador}`}
                  >
                    <i className="bi bi-file-earmark-arrow-up-fill"></i>
                    <span>Cadastrar Notas (CSV)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger px-3 py-1 rounded-pill d-flex align-items-center gap-1 fw-semibold"
                    onClick={() => onAbrirExcluirDadosCsv(turmaSelecionada)}
                    title={`Excluir notas e faltas do CSV da turma ${turmaSelecionada.nome_identificador}`}
                  >
                    <i className="bi bi-trash3-fill"></i>
                    <span>Excluir dados do CSV</span>
                  </button>
                </div>
              )}
            </div>
            <small className="text-muted">
              {alunoSelecionado
                ? `Exibindo lançamentos de ${alunoSelecionado.name} (${notasFiltradas.length} notas no período).`
                : "Selecione um estudante abaixo para carregar as notas correspondentes."}
            </small>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Seletor Individual de Aluno */}
            <div className="d-flex align-items-center gap-1">
              <label htmlFor="filtro-aluno-select" className="visually-hidden">
                Filtrar por Estudante
              </label>
              <select
                id="filtro-aluno-select"
                className="form-select form-select-sm fw-semibold"
                style={{ minWidth: "220px", maxWidth: "260px" }}
                value={alunoFiltroId}
                onChange={(e) => onAlunoFiltroChange(e.target.value)}
                aria-label="Filtrar por estudante"
              >
                <option value="">Selecione um aluno da turma...</option>
                {alunosTurma.map((aluno) => (
                  <option key={aluno.id} value={String(aluno.id)}>
                    {aluno.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Período Letivo Dinâmico */}
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={periodoFiltro}
              onChange={(e) => onPeriodoFiltroChange(e.target.value)}
              aria-label="Filtrar por período letivo"
            >
              <option value="">Todos os Períodos</option>
              {divisoesParaExibir.length > 0 ? (
                divisoesParaExibir.map((div) => (
                  <option key={div.id_divisao || div.nome} value={div.nome}>
                    {div.nome} ({div.pontos} pts){div.is_atual || div.nome === trimestreAtual ? " (Atual)" : ""}
                  </option>
                ))
              ) : (
                <>
                  <option value="1º Trimestre">1º Trimestre (Atual)</option>
                  <option value="2º Trimestre">2º Trimestre</option>
                  <option value="3º Trimestre">3º Trimestre</option>
                </>
              )}
            </select>

            {/* Campo de Pesquisa Textual */}
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4"
                placeholder="Buscar matéria..."
                value={termoBusca}
                onChange={(e) => onTermoBuscaChange(e.target.value)}
                style={{ width: "170px" }}
                disabled={!alunoFiltroId}
              />
              <i
                className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                style={{ fontSize: "0.8rem" }}
              ></i>
            </div>

            {/* Conexão com o Boletim do Aluno */}
            {alunoFiltroId && onAbrirBoletimAluno && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary px-3 rounded-pill d-flex align-items-center gap-1 fw-semibold"
                onClick={() => onAbrirBoletimAluno(alunoFiltroId)}
                title="Consultar boletim escolar consolidado deste estudante"
              >
                <i className="bi bi-file-earmark-spreadsheet-fill"></i>
                <span>Ver Boletim</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Conteúdo: Estado sem Seleção vs Carregando vs Tabela */}
        {!alunoFiltroId ? (
          /* Estado Inicial Didático: Solicita a seleção do aluno para não sobrecarregar */
          <div className="text-center py-5 border rounded-3 bg-light">
            <div className="fs-1 text-primary mb-2">
              <i className="bi bi-person-lines-fill"></i>
            </div>
            <h6 className="fw-bold text-dark mb-1">Selecione um Aluno para Consultar as Notas</h6>
            <p className="text-muted small mb-0" style={{ maxWidth: "480px", margin: "0 auto" }}>
              Para garantir agilidade e evitar o carregamento simultâneo de todos os alunos de uma vez,
              escolha um estudante no seletor acima para visualizar seus lançamentos e boletim escolar.
            </p>
          </div>
        ) : loadingNotas ? (
          /* Carregamento pontual das notas do aluno */
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
            <span className="text-muted small">Carregando notas do estudante...</span>
          </div>
        ) : notasFiltradas.length === 0 ? (
          /* Nenhuma nota encontrada */
          <div className="text-center py-5 border rounded-3 bg-light">
            <i className="bi bi-journal-x fs-1 text-muted d-block mb-2"></i>
            <h6 className="fw-bold text-dark mb-1">Nenhuma nota encontrada</h6>
            <p className="text-muted small mb-3">
              {termoBusca || periodoFiltro
                ? `Nenhum resultado corresponde aos filtros aplicados${
                    periodoFiltro ? ` (${periodoFiltro})` : ""
                  }.`
                : "Este aluno ainda não possui notas lançadas no diário para a turma selecionada."}
            </p>
            <div className="d-flex justify-content-center gap-2">
              {periodoFiltro && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3 py-1 rounded-pill"
                  onClick={() => onPeriodoFiltroChange("")}
                >
                  <i className="bi bi-calendar3 me-1"></i> Ver todos os períodos
                </button>
              )}
              {podeGerenciar && (
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
          /* Tabela de Notas do Estudante Selecionado */
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
                  const valorMax = Number(
                    nota.valor_maximo ||
                      (nota.periodo_letivo?.includes("3º") ? 40 : 30)
                  );
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
                          {formatarDisciplinaCiclo(nota.disciplina, turmaSelecionada?.ciclo || turmaSelecionada?.ciclo_nome) || "Geral"}
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
