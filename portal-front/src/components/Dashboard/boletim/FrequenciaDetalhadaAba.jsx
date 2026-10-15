const formatarPercentual = (valor) =>
  valor === null ? "—" : `${valor.toLocaleString("pt-BR")}%`;

const obterClasseFrequencia = (percentual) => {
  // A cor indica atenção, mas a porcentagem calculada continua visível ao aluno.
  if (percentual === null) return "boletim__progress-bar--vazio";
  return percentual >= 95
    ? "boletim__progress-bar--alta"
    : "boletim__progress-bar--atencao";
};

export default function FrequenciaDetalhadaAba({ disciplinas }) {
  if (!disciplinas.length) {
    return (
      <p className="boletim__empty" role="status">
        Nenhum dado de frequência foi encontrado para os trimestres consultados.
      </p>
    );
  }

  return (
    <section aria-labelledby="boletim-frequencia-titulo">
      <h2 id="boletim-frequencia-titulo" className="h5 mb-3">
        <i className="bi bi-list-check me-2" aria-hidden="true" />
        Frequência por Disciplina
      </h2>
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
