// Valores ilustrativos permanecem isolados até a API fornecer frequência da turma.
const FREQUENCIA_TURMA_DEMONSTRATIVA = {
  portugues: 92,
  matematica: 92,
  historia: 93,
  geografia: 94,
  ciencias: 91,
  ingles: 91,
};

const normalizarNome = (nome) =>
  nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const formatarNota = (nota) =>
  nota === null
    ? "—"
    : nota.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

const formatarPercentual = (valor) =>
  valor === null ? "—" : `${valor.toLocaleString("pt-BR")}%`;

const obterClasseDiferenca = (diferenca) => {
  if (diferenca === null) return "text-muted";
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
  disciplinas,
  comparativoNotas,
}) {
  const totalAulas = disciplinas.reduce(
    (total, disciplina) => total + disciplina.totalAulas,
    0
  );
  const totalFaltas = disciplinas.reduce(
    (total, disciplina) => total + disciplina.totalFaltas,
    0
  );
  const frequenciaAluno =
    totalAulas > 0
      ? Number((((totalAulas - totalFaltas) / totalAulas) * 100).toFixed(1))
      : null;
  const frequenciaTurmaGlobal = 92.4;

  return (
    <section aria-labelledby="boletim-comparativo-titulo">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 id="boletim-comparativo-titulo" className="h5 mb-1">
            <i className="bi bi-bar-chart-steps me-2" aria-hidden="true" />
            Seu Desempenho vs. Média da Turma
          </h2>
          <p className="text-muted mb-0">
            Compare suas médias e frequência com os indicadores agregados da turma.
          </p>
        </div>
        <span className="badge rounded-pill boletim__badge boletim__badge--demo">
          Frequência demonstrativa
        </span>
      </div>

      <p className="alert alert-warning py-2 small" role="note">
        Os percentuais de frequência da turma abaixo são demonstrativos e não
        representam dados oficiais. A comparação real será conectada quando a
        API disponibilizar esse indicador.
      </p>

      <div className="row g-3">
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
              <p className="boletim__empty mb-0">
                Ainda não há notas disponíveis para comparar.
              </p>
            )}
          </section>
        </div>

        <div className="col-12 col-xl-6">
          <section className="boletim__compare-card h-100">
            <div className="boletim__card-heading">
              <i className="bi bi-people-fill" aria-hidden="true" />
              <h3 className="h6 mb-0">Comparativo de Frequência</h3>
            </div>
            <div className="boletim__frequencia-global">
              <p className="small text-muted mb-2">Frequência Global</p>
              <div className="row align-items-center text-center g-2">
                <div className="col-6">
                  <strong className="boletim__global-percentual">
                    {formatarPercentual(frequenciaAluno)}
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
              {frequenciaAluno !== null && (
                <p className="small fw-semibold mt-3 mb-0">
                  {frequenciaAluno >= frequenciaTurmaGlobal ? (
                    <span className="text-success">
                      <i className="bi bi-arrow-up me-1" aria-hidden="true" />
                      Você está acima da média demonstrativa.
                    </span>
                  ) : (
                    <span className="text-warning-emphasis">
                      <i className="bi bi-arrow-down me-1" aria-hidden="true" />
                      Sua frequência está abaixo da média demonstrativa.
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="boletim__frequencia-comparativo">
              <p className="small fw-semibold mb-2">
                Sua frequência por disciplina e média demonstrativa:
              </p>
              {disciplinas.map((disciplina) => {
                const mediaDemo =
                  FREQUENCIA_TURMA_DEMONSTRATIVA[normalizarNome(disciplina.nome)];
                const acima =
                  mediaDemo !== undefined &&
                  disciplina.frequenciaAnual !== null &&
                  disciplina.frequenciaAnual >= mediaDemo;

                return (
                  <p className="small mb-2" key={disciplina.id}>
                    <i
                      className={`bi ${
                        acima ? "bi-check-circle-fill text-success" : "bi-info-circle-fill text-warning"
                      } me-2`}
                      aria-hidden="true"
                    />
                    {disciplina.nome}: Sua{" "}
                    {formatarPercentual(disciplina.frequenciaAnual)} vs. Turma{" "}
                    {mediaDemo === undefined
                      ? "—"
                      : formatarPercentual(mediaDemo)}
                  </p>
                );
              })}
              <small className="text-muted">
                * Média agregada ilustrativa, aguardando dado oficial da API.
              </small>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
