import { useState } from "react";
import { Link } from "react-router";

/**
 * DesempenhoAlunosCard.jsx - Painel de Desempenho por Disciplina do Professor
 *
 * Papel Didático:
 * Apresenta a estrutura unificada "Por Nota" e "Por Frequência" para a disciplina selecionada:
 * - Coluna 1: Pior Desempenho (Top 5 menores notas ou frequências no período);
 * - Coluna 2: Melhor Desempenho (Top 5 maiores notas ou frequências no período).
 * O seletor de disciplina fica acoplado no cabeçalho do próprio painel com agrupamento por ciclo.
 */
export default function DesempenhoAlunosCard({
  disciplinas = [],
  disciplinaSelecionadaId = "",
  onSelecionarDisciplina,
  gruposPorCiclo = [],
  divisaoNome = "",
  pontosDivisao = 30,
}) {
  const [indicadorAtivo, setIndicadorAtivo] = useState("nota"); // 'nota' | 'frequencia'

  const disciplinaAtiva =
    disciplinas.find((d) => d.id === disciplinaSelecionadaId) ??
    disciplinas[0] ??
    null;

  if (!disciplinaAtiva) {
    return null;
  }

  const isNota = indicadorAtivo === "nota";

  // Obtém os rankings vindos do backend (fallback seguro para arrays vazios)
  const rankingAtual = isNota
    ? disciplinaAtiva.desempenho?.nota
    : disciplinaAtiva.desempenho?.frequencia;

  // Se o backend ainda não tiver populado o bloco desempenho, usa o array de risco existente como fallback
  const fallbackPiores = isNota
    ? (disciplinaAtiva.risco?.alunosPorNota || []).slice(0, 5).map((a, idx) => ({
        posicao: idx + 1,
        id: a.id,
        nome: a.nome,
        turma: a.turma,
        valor: a.mediaAtual ?? 0,
      }))
    : (disciplinaAtiva.risco?.alunosPorFrequencia || []).slice(0, 5).map((a, idx) => ({
        posicao: idx + 1,
        id: a.id,
        nome: a.nome,
        turma: a.turma,
        valor: a.frequenciaAtual ?? 0,
      }));

  const listaPiores = rankingAtual?.piores ?? fallbackPiores;
  const listaMelhores = rankingAtual?.melhores ?? [];

  const sufixo = "%";
  const rotuloIndicador = isNota ? "Aproveitamento" : "Frequência";
  const metaTexto = isNota
    ? `Meta mínima: 60% (${pontosDivisao > 0 ? (pontosDivisao * 0.6).toFixed(1) : 18} pts)`
    : "Meta mínima: 75% de presença";

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white w-100 mb-3">
      {/* 1. Cabeçalho com Título, Seletor de Disciplina e Alternância Nota/Frequência */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary flex-shrink-0"
            style={{ backgroundColor: "var(--dashboard-navy-soft)", width: "42px", height: "42px" }}
            aria-hidden="true"
          >
            <i className={`bi ${isNota ? "bi-mortarboard-fill" : "bi-people-fill"} fs-5`}></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h3 className="fs-5 fw-bold mb-0 text-dark">
                Desempenho dos Alunos
              </h3>
              <span className="badge rounded-pill bg-light text-secondary border small fw-normal">
                {isNota ? "Avaliações & Notas" : "Presença & Diário"}
              </span>
            </div>
            <p className="text-secondary small mb-0">
              Acompanhe os melhores e piores índices da turma na disciplina selecionada.
            </p>
          </div>
        </div>

        {/* Controles da Direita: Dropdown de Disciplina + Pílula Nota/Frequência */}
        <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-lg-auto justify-content-lg-end">
          <div style={{ minWidth: "220px", maxWidth: "340px" }} className="flex-grow-1 flex-lg-grow-0">
            <label htmlFor="select-disciplina-professor" className="visually-hidden">
              Selecionar Disciplina
            </label>
            <select
              id="select-disciplina-professor"
              name="disciplina"
              className="form-select form-select-sm fw-semibold text-dark border-secondary-subtle"
              value={disciplinaAtiva.id}
              onChange={(e) => onSelecionarDisciplina && onSelecionarDisciplina(e.target.value)}
              aria-label="Selecionar disciplina lecionada"
            >
              {gruposPorCiclo.length > 1
                ? gruposPorCiclo.map(([nomeGrupo, itensGrupo]) => (
                    <optgroup key={nomeGrupo} label={nomeGrupo}>
                      {itensGrupo.map((materia) => (
                        <option key={materia.id} value={materia.id}>
                          {materia.rotuloCompleto}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : disciplinas.map((materia) => (
                    <option key={materia.id} value={materia.id}>
                      {materia.rotuloCompleto}
                    </option>
                  ))}
            </select>
          </div>

          <div
            className="btn-group btn-group-sm p-1 bg-light rounded-pill border"
            role="group"
            aria-label="Alternar entre notas e frequência dos alunos"
          >
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                isNota ? "btn-primary shadow-sm text-white" : "text-secondary border-0"
              }`}
              aria-pressed={isNota}
              onClick={() => setIndicadorAtivo("nota")}
            >
              Por Nota
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                !isNota ? "btn-primary shadow-sm text-white" : "text-secondary border-0"
              }`}
              aria-pressed={!isNota}
              onClick={() => setIndicadorAtivo("frequencia")}
            >
              Por Frequência
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Contexto da Disciplina Selecionada */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 small text-muted">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <strong className="text-dark">{disciplinaAtiva.rotuloCompleto}</strong>
          <span>•</span>
          <span>{disciplinaAtiva.aulas_semanais} a/sem ({disciplinaAtiva.carga_horaria_anual}h/ano)</span>
          <span>•</span>
          <span>{disciplinaAtiva.turmas?.length || 0} turma(s) vinculada(s)</span>
          <span>•</span>
          <span className="fw-medium text-dark">{divisaoNome && divisaoNome !== "todos" ? divisaoNome : "Consolidado Geral"}</span>
          {disciplinaAtiva.modoSimulacao && (
            <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill">
              Modo Simulação
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-secondary border rounded-pill">
            {metaTexto}
          </span>
          <Link
            to="/dashboard/turmas?aba=notas"
            className="geral-kpi-arrow-btn"
            style={{ width: "1.75rem", height: "1.75rem", fontSize: "0.95rem" }}
            aria-label="Abrir Notas e Diário Escolar"
            title="Abrir Notas e Diário Escolar"
          >
            <i className="bi bi-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
      </div>

      {/* 3. Seções Lado a Lado: Pior Desempenho vs Melhor Desempenho */}
      <div className="row g-3 mt-0">
        {/* Coluna Esquerda: Pior Desempenho (Top 5) */}
        <div className="col-12 col-md-6">
          <section
            className="card border-0 rounded-3 p-3 h-100"
            style={{
              backgroundColor: "#fffafa",
              border: "1px solid #f2dfe4",
            }}
            aria-label={`Pior Desempenho ${rotuloIndicador}`}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "var(--dashboard-pink, #e6396f)",
                    fontSize: "0.85rem",
                  }}
                  aria-hidden="true"
                >
                  <i className="bi bi-arrow-down-short fs-5"></i>
                </span>
                <div>
                  <h4 className="h6 fw-bold mb-0" style={{ color: "#26344a" }}>
                    Pior Desempenho
                  </h4>
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {isNota ? "Menores notas registradas" : "Menores taxas de frequência"}
                  </small>
                </div>
              </div>
              <span
                className="badge rounded-pill fw-semibold"
                style={{
                  color: "#991b3b",
                  backgroundColor: "#991b3b18",
                  border: "1px solid #991b3b30",
                }}
              >
                Top 5
              </span>
            </div>

            <TabelaRankingAlunos
              alunos={listaPiores}
              rotuloColuna={rotuloIndicador}
              corDestaque="var(--dashboard-pink, #e6396f)"
              sufixo={sufixo}
              alertaAbaixo={isNota ? 60 : 75}
              mensagemVazia={`Nenhum registro de ${rotuloIndicador.toLowerCase()} encontrado nesta etapa.`}
            />
          </section>
        </div>

        {/* Coluna Direita: Melhor Desempenho (Top 5) */}
        <div className="col-12 col-md-6">
          <section
            className="card border-0 rounded-3 p-3 h-100"
            style={{
              backgroundColor: "#f7fafe",
              border: "1px solid #dce8f8",
            }}
            aria-label={`Melhor Desempenho ${rotuloIndicador}`}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: "var(--dashboard-navy, #0d2346)",
                    fontSize: "0.85rem",
                  }}
                  aria-hidden="true"
                >
                  <i className="bi bi-arrow-up-short fs-5"></i>
                </span>
                <div>
                  <h4 className="h6 fw-bold mb-0" style={{ color: "#26344a" }}>
                    Melhor Desempenho
                  </h4>
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {isNota ? "Maiores notas registradas" : "Maiores taxas de presença"}
                  </small>
                </div>
              </div>
              <span
                className="badge rounded-pill fw-semibold"
                style={{
                  color: "#0d2346",
                  backgroundColor: "#0d234614",
                  border: "1px solid #0d234630",
                }}
              >
                Top 5
              </span>
            </div>

            <TabelaRankingAlunos
              alunos={listaMelhores}
              rotuloColuna={rotuloIndicador}
              corDestaque="var(--dashboard-navy, #0d2346)"
              sufixo={sufixo}
              mensagemVazia={`Nenhum registro de ${rotuloIndicador.toLowerCase()} encontrado nesta etapa.`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function TabelaRankingAlunos({
  alunos = [],
  rotuloColuna = "Valor",
  corDestaque = "var(--dashboard-navy)",
  sufixo = "%",
  alertaAbaixo = null,
  mensagemVazia = "Nenhum aluno registrado.",
}) {
  if (alunos.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center p-3 text-muted small text-center flex-grow-1">
        {mensagemVazia}
      </div>
    );
  }

  return (
    <div
      className="table-responsive flex-grow-1"
      style={{ overflowY: "auto", scrollbarGutter: "stable", maxHeight: "180px" }}
    >
      <table className="table table-sm table-hover align-middle mb-0 small">
        <thead className="table-light sticky-top">
          <tr>
            <th scope="col" style={{ width: "36px" }} className="text-center">#</th>
            <th scope="col">Estudante</th>
            <th scope="col">Turma</th>
            <th scope="col" className="text-end">{rotuloColuna}</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((item, idx) => {
            const valorNum = Number(item.valor ?? 0);
            const emAlerta = alertaAbaixo !== null && valorNum < alertaAbaixo;

            return (
              <tr key={item.id || `${item.nome}-${idx}`}>
                <td className="text-center">
                  <span
                    className="badge rounded-circle fw-bold text-white d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: "22px",
                      height: "22px",
                      backgroundColor: corDestaque,
                      fontSize: "0.72rem",
                    }}
                  >
                    {item.posicao || idx + 1}
                  </span>
                </td>
                <td className="fw-semibold text-dark text-truncate" style={{ maxWidth: "160px" }}>
                  {item.nome}
                </td>
                <td className="text-secondary text-truncate" style={{ maxWidth: "120px" }}>
                  {item.turma || "—"}
                </td>
                <td className="text-end fw-bold">
                  <span
                    className={emAlerta ? "badge bg-danger-subtle text-danger border border-danger-subtle" : ""}
                    style={!emAlerta ? { color: corDestaque } : {}}
                  >
                    {valorNum.toFixed(1).replace(".", ",")}
                    {sufixo}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
