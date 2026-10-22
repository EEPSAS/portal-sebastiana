// Mantém ausências de lançamento distinguíveis de notas numéricas.
const formatarNota = (nota) =>
  nota === null
    ? "—"
    : nota.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

const obterClasseTotal = (pontos) => {
  if (pontos === null) return "boletim__nota--indisponivel";
  if (pontos >= 80) return "boletim__nota--alta";
  if (pontos >= 60) return "boletim__nota--media";
  return "boletim__nota--baixa";
};

export default function NotasDetalhadasAba({ disciplinas }) {
  if (!disciplinas.length) {
    return (
      <p className="boletim__empty" role="status">
        Nenhuma nota foi encontrada para os trimestres consultados.
      </p>
    );
  }

  return (
    <section aria-labelledby="boletim-notas-titulo">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <h2 id="boletim-notas-titulo" className="h5 mb-0">
          <i className="bi bi-journal-bookmark-fill me-2" aria-hidden="true" />
          Notas por Disciplina
        </h2>
        <span className="badge rounded-pill boletim__badge">
          Distribuição: 30 pts / 30 pts / 40 pts
        </span>
      </div>

      <div className="table-responsive boletim__table-wrap">
        <table className="table align-middle mb-0 boletim__table">
          <caption className="visually-hidden">
            Notas do aluno em cada trimestre isolado e totalização anual acumulada.
          </caption>
          <thead>
            <tr>
              <th scope="col">Disciplina</th>
              <th scope="col">1º Trimestre (30 pts)</th>
              <th scope="col">2º Trimestre (30 pts)</th>
              <th scope="col">3º Trimestre (40 pts)</th>
              <th scope="col" className="text-center">
                Total Anual (100 pts)
              </th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.map((disciplina) => (
              <tr key={disciplina.id}>
                <th scope="row" className="fw-semibold">
                  {disciplina.nome}
                </th>
                {disciplina.notas.map((nota, indice) => (
                  <td key={`${disciplina.id}-trimestre-${indice + 1}`}>
                    {formatarNota(nota)}
                  </td>
                ))}
                <td className="text-center">
                  <span
                    className={`boletim__nota ${obterClasseTotal(disciplina.mediaFinal)}`}
                    aria-label={
                      disciplina.mediaFinal === null
                        ? "Total anual indisponível"
                        : `Total anual ${formatarNota(disciplina.mediaFinal)} pontos`
                    }
                  >
                    {formatarNota(disciplina.mediaFinal)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="boletim__legenda mt-3" aria-label="Legenda de aproveitamento">
        <span>
          <i className="boletim__legenda-ponto boletim__legenda-ponto--alta" />
          Aproveitamento ≥ 80,0 pts
        </span>
        <span>
          <i className="boletim__legenda-ponto boletim__legenda-ponto--media" />
          Aprovado 60,0–79,9 pts
        </span>
        <span>
          <i className="boletim__legenda-ponto boletim__legenda-ponto--baixa" />
          Abaixo da Média &lt; 60,0 pts
        </span>
      </div>
      <p className="boletim__caption mt-3 mb-0">
        Valores “—” indicam dados ainda não lançados. A coluna Total Anual consolida a soma das pontuações dos períodos cursados.
      </p>
    </section>
  );
}
