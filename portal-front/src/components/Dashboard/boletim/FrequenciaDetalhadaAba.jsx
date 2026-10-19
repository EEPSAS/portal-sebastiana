import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Formata o percentual de presença com vírgula decimal padrão pt-BR
const formatarPercentual = (valor) =>
  valor === null ? "—" : `${valor.toLocaleString("pt-BR")}%`;

// Define a classe visual conforme o limite de atenção (95%)
const obterClasseFrequencia = (percentual) => {
  // A cor indica atenção, mas a porcentagem calculada continua visível ao aluno.
  if (percentual === null) return "boletim__progress-bar--vazio";
  return percentual >= 95
    ? "boletim__progress-bar--alta"
    : "boletim__progress-bar--atencao";
};

/**
 * Aba de Frequência Detalhada do Boletim Escolar.
 * Exibe gráfico comparativo anual via Recharts (com linha de referência LDB de 75%)
 * seguido do detalhamento de aulas e faltas por trimestre em cada disciplina.
 */
export default function FrequenciaDetalhadaAba({ disciplinas }) {
  if (!disciplinas.length) {
    return (
      <p className="boletim__empty" role="status">
        Nenhum dado de frequência foi encontrado para os trimestres consultados.
      </p>
    );
  }

  // Prepara a série de dados para o gráfico comparativo do Recharts
  const dadosGraficoFrequencia = disciplinas
    .filter((d) => d.frequenciaAnual !== null)
    .map((d) => ({
      nome: d.nome,
      frequencia: Number(d.frequenciaAnual),
      faltas: d.totalFaltas,
      aulas: d.totalAulas,
    }));

  return (
    <section aria-labelledby="boletim-frequencia-titulo">
      <h2 id="boletim-frequencia-titulo" className="h5 mb-3">
        <i className="bi bi-list-check me-2" aria-hidden="true" />
        Frequência por Disciplina
      </h2>

      {/* Gráfico Analítico Recharts: Comparativo Anual de Presença por Disciplina */}
      {dadosGraficoFrequencia.length > 0 && (
        <section
          className="boletim__card mb-4"
          aria-label="Gráfico comparativo de frequência anual por disciplina"
        >
          <div className="boletim__card-heading">
            <i className="bi bi-bar-chart-fill" aria-hidden="true" />
            <h3 className="h6 mb-0">
              Taxa de Presença Anual por Componente Curricular (Mínimo Legal: 75%)
            </h3>
          </div>
          <div className="boletim__chart" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoFrequencia}
                margin={{ top: 12, right: 16, left: -12, bottom: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={dadosGraficoFrequencia.length > 4 ? -15 : 0}
                  textAnchor={dadosGraficoFrequencia.length > 4 ? "end" : "middle"}
                  height={dadosGraficoFrequencia.length > 4 ? 50 : 32}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 12 }}
                  width={44}
                  tickFormatter={(valor) => `${valor}%`}
                />
                <Tooltip
                  formatter={(valor, _, item) => [
                    `${formatarPercentual(Number(valor))} (${item.payload.faltas} faltas em ${item.payload.aulas} aulas)`,
                    "Presença Anual",
                  ]}
                  labelFormatter={(nome) => `Disciplina: ${nome}`}
                />
                <ReferenceLine
                  y={75}
                  stroke="#dc3545"
                  strokeDasharray="4 4"
                  label={{
                    value: "Mín. 75%",
                    position: "insideTopRight",
                    fill: "#dc3545",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="frequencia" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {dadosGraficoFrequencia.map((item) => (
                    <Cell
                      key={item.nome}
                      fill={
                        item.frequencia >= 95
                          ? "var(--dashboard-navy)"
                          : item.frequencia >= 75
                          ? "var(--dashboard-amber)"
                          : "#dc3545"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Detalhamento Trimestral de Aulas e Faltas por Disciplina */}
      <div className="row g-3">
        {disciplinas.map((disciplina) => (
          <div className="col-12 col-lg-6" key={disciplina.id}>
            <article className="boletim__frequencia-card h-100">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3 className="h6 mb-0">{disciplina.nome}</h3>
                <span className="small text-muted">
                  Anual: {formatarPercentual(disciplina.frequenciaAnual)}
                </span>
              </div>
              {disciplina.frequenciaTrimestral.map((percentual, indice) => {
                const aulas = disciplina.aulas[indice];
                const faltas = disciplina.faltas[indice];
                const barraClasse = obterClasseFrequencia(percentual);

                return (
                  <div
                    className="boletim__frequencia-trimestre"
                    key={`${disciplina.id}-trimestre-${indice + 1}`}
                  >
                    <div className="d-flex justify-content-between align-items-center gap-2">
                      <span className="small fw-semibold">
                        {indice + 1}º Trimestre
                      </span>
                      <span className="small text-muted">
                        Aulas: {aulas} | Faltas: {faltas}
                      </span>
                      <strong
                        className={
                          percentual !== null && percentual < 95
                            ? "boletim__frequencia-valor boletim__frequencia-valor--atencao"
                            : "boletim__frequencia-valor"
                        }
                      >
                        {formatarPercentual(percentual)}
                      </strong>
                    </div>
                    <div
                      className="progress boletim__progress"
                      role="progressbar"
                      aria-label={`${disciplina.nome}, ${indice + 1}º trimestre`}
                      aria-valuenow={percentual ?? 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuetext={formatarPercentual(percentual)}
                    >
                      <div
                        className={`progress-bar ${barraClasse}`}
                        style={{ width: `${percentual ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
