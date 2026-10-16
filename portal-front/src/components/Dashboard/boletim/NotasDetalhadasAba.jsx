// Mantém ausências de lançamento distinguíveis de notas numéricas.
const formatarNota = (nota) =>
  nota === null
    ? "—"
    : nota.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

const obterClasseMedia = (media) => {
  if (media === null) return "boletim__nota--indisponivel";
  if (media >= 8) return "boletim__nota--alta";
  if (media >= 6) return "boletim__nota--media";
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
          Média final: 30% / 30% / 40%
        </span>
      </div>

      <div className="table-responsive boletim__table-wrap">
        <table className="table align-middle mb-0 boletim__table">
          <caption className="visually-hidden">
            Notas do aluno em cada trimestre e média final ponderada.
          </caption>
          <thead>
            <tr>
              <th scope="col">Disciplina</th>
              <th scope="col">1º Trimestre</th>
              <th scope="col">2º Trimestre</th>
              <th scope="col">3º Trimestre</th>
              <th scope="col" className="text-center">
                Média Final
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
                    className={`boletim__nota ${obterClasseMedia(disciplina.mediaFinal)}`}
                    aria-label={
                      disciplina.mediaFinal === null
                        ? "Média final indisponível"
                        : `Média final ${formatarNota(disciplina.mediaFinal)}`
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

      <div className="boletim__legenda mt-3" aria-label="Legenda das médias">
        <span>
          <i className="boletim__legenda-ponto boletim__legenda-ponto--alta" />
          Média ≥ 8,0
        </span>
        <span>
          <i className="boletim__legenda-ponto boletim__legenda-ponto--media" />
          Média 6,0–7,9
        </span>
        <span>
          <i className="boletim__legenda-ponto boletim__legenda-ponto--baixa" />
          Média &lt; 6,0
        </span>
      </div>
      <p className="boletim__caption mt-3 mb-0">
        Valores “—” indicam dados ainda não lançados ou uma média que aguarda
        notas dos três trimestres.
      </p>
    </section>
  );
}
