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
export default function ListaAlunosRisco({ indicador, alunos }) {
  const configuracao = CONFIGURACAO_INDICADOR[indicador];

  if (!configuracao) {
    return null;
  }

  return (
    <div
      className="border-start border-dark border-opacity-10 ps-3 flex-grow-1"
      style={{ maxHeight: "11.5rem", minWidth: 0, overflowY: "auto" }}
      tabIndex={0}
      aria-label="Lista de alunos em risco"
    >
      <div className="rounded-3 overflow-hidden border border-dark">
        <table className="table table-sm table-bordered border-dark align-middle mb-0 small">
          <thead>
            <tr>
              <th scope="col">Nome do aluno</th>
              <th scope="col">Turma</th>
              <th scope="col">{configuracao.tituloColuna}</th>
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
