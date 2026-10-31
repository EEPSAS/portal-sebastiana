const CONFIGURACAO_INDICADOR = {
  nota: {
    tituloColuna: "Média atual",
    propriedadeValor: "mediaAtual",
  },
  frequencia: {
    tituloColuna: "Frequência atual",
    propriedadeValor: "frequenciaAtual",
  },
};

/** Exibe todos os alunos em risco em uma tabela única por indicador. */
export default function ListaAlunosRisco({
  indicador,
  alunos,
  corFundo,
  corTexto,
}) {
  const configuracao = CONFIGURACAO_INDICADOR[indicador];

  if (!configuracao) {
    return null;
  }

  return (
    <div
      className="border-start ps-3 flex-grow-1"
      style={{
        maxHeight: "10.5rem",
        minWidth: 0,
        overflowY: "auto",
        borderColor: "rgba(38, 52, 74, 0.12)",
      }}
      tabIndex={0}
      aria-label="Lista de alunos em risco"
    >
      <div
        className="rounded-3 overflow-hidden border"
        style={{ borderColor: "rgba(38, 52, 74, 0.14)" }}
      >
        <table
          className="table table-sm table-bordered align-middle mb-0 small"
          style={{
            "--bs-table-bg": corFundo,
            "--bs-table-color": "#39465b",
            "--bs-table-border-color": "rgba(38, 52, 74, 0.12)",
          }}
        >
          <thead>
            <tr>
              <th
                className="fw-bold"
                scope="col"
                style={{ color: corTexto, backgroundColor: "rgba(38, 52, 74, 0.045)" }}
              >
                Nome do aluno
              </th>
              <th
                className="fw-bold text-nowrap"
                scope="col"
                style={{ color: corTexto, backgroundColor: "rgba(38, 52, 74, 0.045)" }}
              >
                Turma
              </th>
              <th
                className="fw-bold text-nowrap"
                scope="col"
                style={{ color: corTexto, backgroundColor: "rgba(38, 52, 74, 0.045)" }}
              >
                {configuracao.tituloColuna}
              </th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.nome}</td>
                <td>{aluno.turma || "Não informada"}</td>
                <td>{aluno[configuracao.propriedadeValor]}%</td>
              </tr>
            ))}
            {alunos.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-3">
                  Nenhum aluno nesta lista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
