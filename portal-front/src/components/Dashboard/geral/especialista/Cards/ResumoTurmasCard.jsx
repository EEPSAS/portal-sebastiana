import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

/**
 * ResumoTurmasCard.jsx - Painel Gráfico de Médias e Frequências por Turma (Recharts)
 *
 * Papel Didático:
 * Padroniza a visualização de indicadores analíticos do Especialista/Professor utilizando
 * a biblioteca oficial Recharts (<BarChart>), substituindo barras de progresso CSS/SVG manuais:
 * 1. Card Esquerdo (8 colunas): Gráfico de barras horizontais de Média de Notas por Turma (escala 0 a 10).
 * 2. Card Direito (4 colunas): Gráfico de barras horizontais de Taxa de Presença por Turma (escala 0% a 100%,
 *    com linha de referência na meta mínima legal de 75% da LDB).
 * Contempla também os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio).
 */
export default function GeralMediumCards({
  medias = [],
  frequencias = [],
  loading = false,
  error = null,
}) {
  // 1. Estado Assíncrono: Carregando
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando gráficos das turmas...</span>
        </div>
      </div>
    );
  }

  // 2. Estado Assíncrono: Erro Amigável
  if (error) {
    return (
      <div className="alert alert-danger rounded-3 my-3" role="alert">
        Erro ao carregar o resumo gráfico das turmas: {error}
      </div>
    );
  }

  // Prepara os dados de médias (garantindo número de 0 a 10 para o Recharts)
  const dadosMedias = medias.map((item) => ({
    id: item.id,
    turma: item.turma,
    nota: item.nota !== null && item.nota !== undefined ? Number(item.nota) : 0,
    possuiNota: item.nota !== null && item.nota !== undefined,
  }));

  // Prepara os dados de frequência (garantindo percentual de 0 a 100 para o Recharts)
  const dadosFrequencias = frequencias.map((item) => ({
    id: item.id,
    turma: item.turma,
    percentual:
      item.percentual !== null && item.percentual !== undefined
        ? Number(item.percentual)
        : 0,
  }));

  // Calcula altura dinâmica proporcional ao número de turmas para evitar barras esmagadas
  const alturaGraficoMedias = Math.max(220, dadosMedias.length * 56);
  const alturaGraficoFrequencias = Math.max(220, dadosFrequencias.length * 56);

  return (
    <div className="row g-3 my-2">
      {/* Card 1: Média de Notas por Turma com Recharts */}
      <div className="col-12 col-lg-7">
        <div className="geral-chart-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-bell text-primary"></i>
              <span>Média de Notas por Turma</span>
            </h5>
            <span className="geral-chart-badge">Escala 0 a 10</span>
          </div>

          {/* 3. Estado Assíncrono: Vazio */}
          {dadosMedias.length === 0 ? (
            <p className="text-muted small mb-0 py-4 text-center">
              Nenhuma turma encontrada no momento.
            </p>
          ) : (
            <div style={{ width: "100%", height: `${alturaGraficoMedias}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dadosMedias}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} tickCount={6} />
                  <YAxis
                    type="category"
                    dataKey="turma"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)} pts`, "Média Geral"]}
                  />
                  {/* Linha de referência na média escolar de aprovação (6,0) */}
                  <ReferenceLine
                    x={6}
                    stroke="#dc3545"
                    strokeDasharray="3 3"
                    label={{ value: "Média geral", position: "top", fontSize: 11, fill: "#dc3545" }}
                  />
                  <Bar dataKey="nota" name="Média da Turma" radius={[0, 6, 6, 0]} barSize={22}>
                    {dadosMedias.map((entry) => (
                      <Cell
                        key={`cell-media-${entry.id}`}
                        fill={entry.nota >= 6 ? "var(--dashboard-navy)" : "var(--dashboard-pink)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Taxa de Presença (Frequência) por Turma com Recharts */}
      <div className="col-12 col-lg-5">
        <div className="geral-chart-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-primary"></i>
              <span>Frequência por Turma</span>
            </h5>
            <span className="geral-chart-badge">Meta mín. 75%</span>
          </div>

          {/* 3. Estado Assíncrono: Vazio */}
          {dadosFrequencias.length === 0 ? (
            <p className="text-muted small mb-0 py-4 text-center">
              Sem dados de frequência no momento.
            </p>
          ) : (
            <div style={{ width: "100%", height: `${alturaGraficoFrequencias}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dadosFrequencias}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="turma"
                    width={130}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Taxa de Presença"]}
                  />
                  {/* Linha de referência no limite mínimo legal de 75% de presença */}
                  <ReferenceLine
                    x={75}
                    stroke="#dc3545"
                    strokeDasharray="3 3"
                    label={{ value: "75%", position: "top", fontSize: 11, fill: "#dc3545" }}
                  />
                  <Bar dataKey="percentual" name="Presença (%)" radius={[0, 6, 6, 0]} barSize={22}>
                    {dadosFrequencias.map((entry) => (
                      <Cell
                        key={`cell-freq-${entry.id}`}
                        fill={
                          entry.percentual >= 75
                            ? "var(--dashboard-navy)"
                            : "var(--dashboard-pink)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}