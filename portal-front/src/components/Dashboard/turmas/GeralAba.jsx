import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Aba Geral / Default de Turmas.
 * Apresenta cards com indicadores agregados e gráficos interativos via Recharts
 * para acompanhamento da média geral e da frequência escolar por turma.
 */
const GeralAba = ({ resumoGeral = [], totalMatriculados = 0, loading = false, temaGestao = false }) => {
  // Cores das barras: tema de gestão (especialista/adm) usa a paleta azul do mockup; demais papéis mantêm a atual
  const corBarraMedia = temaGestao ? "#6b86d6" : "var(--dashboard-pink)";
  const corBarraPresenca = temaGestao ? "#1e3d70" : "var(--dashboard-navy)";

  // Cálculo direto dos indicadores globais para os cards (sem memoização prematura)
  const totalTurmas = resumoGeral.length;

  // Filtra turmas que possuem notas lançadas para calcular a média aritmética global
  const turmasComNotas = resumoGeral.filter((t) => Number(t.media_geral) > 0);
  const mediaGeralGlobal =
    turmasComNotas.length > 0
      ? (
          turmasComNotas.reduce((acc, t) => acc + Number(t.media_geral), 0) /
          turmasComNotas.length
        ).toFixed(1)
      : "—";

  // Filtra turmas que possuem registros de frequência para calcular a presença média global
  const turmasComFrequencia = resumoGeral.filter((t) => Number(t.taxa_presenca) > 0);
  const taxaPresencaGlobal =
    turmasComFrequencia.length > 0
      ? Math.round(
          turmasComFrequencia.reduce((acc, t) => acc + Number(t.taxa_presenca), 0) /
            turmasComFrequencia.length
        )
      : "—";

  const metricasGlobais = {
    totalTurmas,
    totalMatriculados,
    mediaGeralGlobal,
    taxaPresencaGlobal,
  };

  // Dados formatados para o gráfico de Média Geral por Turma (Recharts)
  const dadosGraficoMedia = resumoGeral.map((t) => ({
    turma: t.nome_identificador,
    media: Number(t.media_geral || 0),
  }));

  // Dados formatados para o gráfico de Frequência por Turma (Recharts)
  const dadosGraficoPresenca = resumoGeral.map((t) => ({
    turma: t.nome_identificador,
    frequencia: Number(t.taxa_presenca || 0),
  }));

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
        <span className="text-muted small">Carregando indicadores analíticos...</span>
      </div>
    );
  }

  if (resumoGeral.length === 0) {
    return (
      <div className="text-center py-5 border rounded-4 bg-light">
        <i className="bi bi-bar-chart fs-1 text-muted d-block mb-2"></i>
        <h6 className="fw-bold text-dark mb-1">Nenhum dado analítico disponível</h6>
        <p className="text-muted small mb-0">
          Cadastre turmas e importe diários de notas para visualizar os gráficos analíticos.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Cards de Indicadores Globais */}
      <div className="row g-2 g-md-3 mb-2">
        {/* Total de Turmas */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="turma-stat-card p-2 p-md-3 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>
                  Total de Turmas
                </small>
                <h3 className="fw-bold mb-0 text-dark mt-1">{metricasGlobais.totalTurmas}</h3>
              </div>
              <div
                className="turma-stat-icon turma-stat-icon--turmas"
              >
                <i className="bi bi-collection-fill fs-5"></i>
              </div>
            </div>
            {/* Rodapé do card: descrição + seta (a seta só aparece no tema de gestão) */}
            <div className="turma-stat-rodape">
              <small className="text-muted">Turmas registradas na escola</small>
              <i className="bi bi-arrow-right turma-stat-seta" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        {/* Estudantes Matriculados */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="turma-stat-card p-2 p-md-3 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>
                  Matrículas Ativas
                </small>
                <h3 className="fw-bold mb-0 text-dark mt-1">{metricasGlobais.totalMatriculados}</h3>
              </div>
              <div
                className="turma-stat-icon turma-stat-icon--matriculas"
              >
                <i className="bi bi-people-fill fs-5"></i>
              </div>
            </div>
            {/* Rodapé do card: descrição + seta (a seta só aparece no tema de gestão) */}
            <div className="turma-stat-rodape">
              <small className="text-muted">Estudantes com vínculo ativo</small>
              <i className="bi bi-arrow-right turma-stat-seta" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        {/* Média Geral da Escola */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="turma-stat-card p-2 p-md-3 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>
                  Média Geral das Turmas
                </small>
                <h3 className="fw-bold mb-0 text-dark mt-1">{metricasGlobais.mediaGeralGlobal}</h3>
              </div>
              <div
                className="turma-stat-icon turma-stat-icon--media"
              >
                <i className="bi bi-award-fill fs-5"></i>
              </div>
            </div>
            {/* Rodapé do card: descrição + seta (a seta só aparece no tema de gestão) */}
            <div className="turma-stat-rodape">
              <small className="text-muted">Média aritmética consolidada</small>
              <i className="bi bi-arrow-right turma-stat-seta" aria-hidden="true"></i>
            </div>
          </div>
        </div>

        {/* Frequência Escolar Média */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="turma-stat-card p-2 p-md-3 h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.75rem" }}>
                  Frequência Média
                </small>
                <h3 className="fw-bold mb-0 text-dark mt-1">
                  {metricasGlobais.taxaPresencaGlobal !== "—"
                    ? `${metricasGlobais.taxaPresencaGlobal}%`
                    : "—"}
                </h3>
              </div>
              <div
                className="turma-stat-icon turma-stat-icon--frequencia"
              >
                <i className="bi bi-person-check-fill fs-5"></i>
              </div>
            </div>
            {/* Rodapé do card: descrição + seta (a seta só aparece no tema de gestão) */}
            <div className="turma-stat-rodape">
              <small className="text-muted">Taxa média de presença</small>
              <i className="bi bi-arrow-right turma-stat-seta" aria-hidden="true"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Gráficos Analíticos com Recharts */}
      <div className="row g-4">
        {/* Gráfico 1: Média Geral por Turma */}
        <div className="col-12 col-lg-6">
          <div className="turma-stat-card p-2 p-md-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0 fs-6">Média Geral por Turma</h5>
                <small className="text-muted">Aproveitamento médio calculado (escala 0 a 10)</small>
              </div>
              <span className="badge bg-light text-dark border">Notas</span>
            </div>

            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoMedia} margin={{ top: temaGestao ? 22 : 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dashboard-gray-soft)" />
                  <XAxis
                    dataKey="turma"
                    tick={{ fontSize: 11, fill: "var(--dashboard-ink-muted)" }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--dashboard-ink-muted)" }} />
                  <Tooltip
                    formatter={(valor) => [`${Number(valor).toFixed(1)} pts`, "Média Geral"]}
                    labelStyle={{ color: "var(--dashboard-navy)", fontWeight: "bold" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--dashboard-gray-border)" }}
                  />
                  <Bar dataKey="media" fill={corBarraMedia} radius={[6, 6, 0, 0]} maxBarSize={temaGestao ? 60 : 45}>
                    {/* Valor acima de cada barra (somente tema de gestão) */}
                    {temaGestao && (
                      <LabelList
                        dataKey="media"
                        position="top"
                        formatter={(v) => Number(v).toFixed(1)}
                        style={{ fontSize: 11, fontWeight: 700, fill: "var(--dashboard-navy)" }}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Taxa de Presença por Turma */}
        <div className="col-12 col-lg-6">
          <div className="turma-stat-card p-2 p-md-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0 fs-6">Taxa de Presença por Turma</h5>
                <small className="text-muted">Percentual de comparecimento às aulas (%)</small>
              </div>
              <span className="badge bg-light text-dark border">Frequência</span>
            </div>

            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoPresenca} margin={{ top: temaGestao ? 22 : 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dashboard-gray-soft)" />
                  <XAxis
                    dataKey="turma"
                    tick={{ fontSize: 11, fill: "var(--dashboard-ink-muted)" }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => temaGestao ? `${v}%` : v} tick={{ fontSize: 11, fill: "var(--dashboard-ink-muted)" }} />
                  <Tooltip
                    formatter={(valor) => [`${valor}%`, "Taxa de Presença"]}
                    labelStyle={{ color: "var(--dashboard-navy)", fontWeight: "bold" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--dashboard-gray-border)" }}
                  />
                  <Bar dataKey="frequencia" fill={corBarraPresenca} radius={[6, 6, 0, 0]} maxBarSize={temaGestao ? 60 : 45}>
                    {temaGestao && (
                      <LabelList
                        dataKey="frequencia"
                        position="top"
                        formatter={(v) => `${v}%`}
                        style={{ fontSize: 11, fontWeight: 700, fill: "var(--dashboard-navy)" }}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeralAba;
