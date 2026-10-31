/**
 * ComparativoTurmaAba.jsx - Aba de Comparativo Individual vs. Média da Turma
 *
 * Papel Didático:
 * Apresenta a análise comparativa entre as notas e percentuais de frequência do aluno
 * e os indicadores consolidados oficiais de sua turma, calculados diretamente pelo
 * backend Laravel com base no diário escolar consolidado (Módulo 5 via CSV).
 */

const normalizarNome = (nome) =>
  (nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatarNota = (nota) =>
  nota === null || nota === undefined
    ? "—"
    : Number(nota).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

const formatarPercentual = (valor) =>
  valor === null || valor === undefined
    ? "—"
    : `${Number(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`;

const obterClasseDiferenca = (diferenca) => {
  if (diferenca === null || diferenca === undefined) return "text-muted";
  return diferenca >= 0 ? "text-success" : "text-danger";
};

const BarraComparativa = ({ valor, maximo, cor, rotulo }) => (
  <div
    className="progress boletim__comparativo-progress"
    role="progressbar"
    aria-label={rotulo}
    aria-valuenow={valor ?? 0}
    aria-valuemin="0"
    aria-valuemax={maximo}
    aria-valuetext={valor === null ? "Sem nota" : `${formatarNota(valor)} de ${maximo}`}
  >
    <div
      className="progress-bar"
      style={{
        width: `${valor === null ? 0 : Math.min(100, (valor / maximo) * 100)}%`,
        backgroundColor: cor,
      }}
    />
  </div>
);

export default function ComparativoTurmaAba({
  disciplinas = [],
  comparativoNotas = [],
  frequenciaAlunoGlobal = null,
  frequenciaTurmaGlobal = null,
}) {
  // Cálculo de contingência da frequência global do aluno a partir das disciplinas
  const totalAulas = disciplinas.reduce(
    (total, disciplina) => total + (disciplina.totalAulas || 0),
    0
  );
  const totalFaltas = disciplinas.reduce(
    (total, disciplina) => total + (disciplina.totalFaltas || 0),
    0
  );

  const frequenciaAlunoCalculada =
    frequenciaAlunoGlobal !== null
      ? frequenciaAlunoGlobal
      : totalAulas > 0
      ? Number((((totalAulas - totalFaltas) / totalAulas) * 100).toFixed(1))
      : null;

  return (
    <section aria-labelledby="boletim-comparativo-titulo">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 id="boletim-comparativo-titulo" className="h5 mb-1">
            <i className="bi bi-bar-chart-steps me-2 text-primary" aria-hidden="true" />
            Seu Desempenho vs. Média da Turma
          </h2>
          <p className="text-muted mb-0 small">
            Compare suas médias e frequência com os indicadores agregados oficiais da turma.
          </p>
        </div>
        <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-semibold small">
          <i className="bi bi-shield-check me-1 text-success" aria-hidden="true" />
          Dados Oficiais da Turma
        </span>
      </div>

      <div className="row g-3">
        {/* Card 1: Comparativo de Notas */}
        <div className="col-12 col-xl-6">
          <section className="boletim__compare-card h-100">
            <div className="boletim__card-heading">
              <i className="bi bi-mortarboard-fill" aria-hidden="true" />
              <h3 className="h6 mb-0">Comparativo de Notas</h3>
            </div>
            {comparativoNotas.length ? (
              <div className="d-flex flex-column gap-3">
                {comparativoNotas.map((registro) => {
                  const diferenca =
                    registro.notaAluno !== null && registro.mediaTurma !== null
                      ? Number((registro.notaAluno - registro.mediaTurma).toFixed(2))
                      : null;

                  return (
                    <article
                      className="boletim__comparativo-item"
                      key={registro.id}
                    >
                      <div className="d-flex justify-content-between gap-2">
                        <h4 className="small fw-semibold mb-2">
                          {registro.nome}
                        </h4>
                        <span className={obterClasseDiferenca(diferenca)}>
                          {diferenca === null
                            ? "—"
                            : `${diferenca > 0 ? "+" : ""}${formatarNota(diferenca)}`}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>
                          Você: <strong>{formatarNota(registro.notaAluno)}</strong>
                        </span>
                        <span>
                          Turma: <strong>{formatarNota(registro.mediaTurma)}</strong>
                        </span>
                      </div>
                      <BarraComparativa
                        valor={registro.notaAluno}
                        maximo={registro.valorMaximo || 30}
                        cor="var(--dashboard-pink)"
                        rotulo={`Nota de ${registro.nome} do aluno`}
                      />
                      <BarraComparativa
                        valor={registro.mediaTurma}
                        maximo={registro.valorMaximo || 30}
                        cor="var(--dashboard-gray)"
                        rotulo={`Média de ${registro.nome} da turma`}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="boletim__empty mb-0 text-muted small">
                Ainda não há notas lançadas para comparar.
              </p>
            )}
          </section>
        </div>

        {/* Card 2: Comparativo de Frequência */}
        <div className="col-12 col-xl-6">
          <section className="boletim__compare-card h-100">
            <div className="boletim__card-heading">
              <i className="bi bi-people-fill" aria-hidden="true" />
              <h3 className="h6 mb-0">Comparativo de Frequência</h3>
            </div>
            <div className="boletim__frequencia-global">
              <p className="small text-muted mb-2">Frequência Global Consolidada</p>
              <div className="row align-items-center text-center g-2">
                <div className="col-6">
                  <strong className="boletim__global-percentual">
                    {formatarPercentual(frequenciaAlunoCalculada)}
                  </strong>
                  <span className="d-block small fw-semibold">SUA FREQUÊNCIA</span>
                </div>
                <div className="col-6 border-start">
                  <strong className="boletim__global-percentual boletim__global-percentual--turma">
                    {formatarPercentual(frequenciaTurmaGlobal)}
                  </strong>
                  <span className="d-block small fw-semibold">MÉDIA DA TURMA*</span>
                </div>
              </div>
              {frequenciaAlunoCalculada !== null && frequenciaTurmaGlobal !== null && (
                <p className="small fw-semibold mt-3 mb-0">
                  {frequenciaAlunoCalculada >= frequenciaTurmaGlobal ? (
                    <span className="text-success">
                      <i className="bi bi-arrow-up me-1" aria-hidden="true" />
                      Você está acima da média da turma.
                    </span>
                  ) : (
                    <span className="text-warning-emphasis">
                      <i className="bi bi-arrow-down me-1" aria-hidden="true" />
                      Sua frequência está abaixo da média da turma.
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="boletim__frequencia-comparativo">
              <p className="small fw-semibold mb-2">
                Sua frequência por disciplina e média da turma:
              </p>
              {disciplinas.length > 0 ? (
                disciplinas.map((disciplina) => {
                  const regComparativo = comparativoNotas.find(
                    (c) =>
                      String(c.id) === String(disciplina.id) ||
                      normalizarNome(c.nome) === normalizarNome(disciplina.nome)
                  );

                  const freqTurmaDisc = regComparativo?.frequenciaTurma ?? null;
                  const freqAlunoDisc =
                    disciplina.frequenciaAnual ?? regComparativo?.frequenciaAluno ?? null;

                  const temDados = freqTurmaDisc !== null && freqAlunoDisc !== null;
                  const acima = temDados && freqAlunoDisc >= freqTurmaDisc;

                  return (
                    <p className="small mb-2 d-flex align-items-center justify-content-between" key={disciplina.id}>
                      <span>
                        <i
                          className={`bi ${
                            !temDados
                              ? "bi-dash-circle text-muted"
                              : acima
                              ? "bi-check-circle-fill text-success"
                              : "bi-info-circle-fill text-warning"
                          } me-2`}
                          aria-hidden="true"
                        />
                        {disciplina.nome}
                      </span>
                      <span className="text-muted fw-semibold">
                        Sua: <strong>{formatarPercentual(freqAlunoDisc)}</strong> vs. Turma: <strong>{formatarPercentual(freqTurmaDisc)}</strong>
                      </span>
                    </p>
                  );
                })
              ) : (
                <p className="text-muted small mb-0">
                  Nenhuma disciplina cadastrada na turma.
                </p>
              )}
              <small className="text-muted d-block mt-3">
                * Indicadores calculados automaticamente com base no diário consolidado oficial da turma.
              </small>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
