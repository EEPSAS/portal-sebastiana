/** Tabela compacta e reutilizável para cada grupo de vencimento dos empréstimos. */
export default function DevolucoesTabela({
  titulo,
  emprestimos,
  formatarData,
  mensagemVazia,
  corBadge,
  onNotificar,
}) {
  return (
    <section
      className="card border-0 dashboard-card-shadow rounded-3 h-100 p-2 px-md-3"
      aria-label={titulo}
    >
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <h2 className="h6 fw-bold mb-0">{titulo}</h2>
        <span className={`badge rounded-pill ${corBadge}`}>
          {emprestimos.length}
        </span>
      </div>
      {emprestimos.length === 0 ? (
        <p className="text-muted small mb-0">{mensagemVazia}</p>
      ) : (
        <div
          className="table-responsive flex-grow-1"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          <table
            className="table table-sm table-hover align-middle mb-0"
            style={{ minWidth: onNotificar ? "390px" : "350px" }}
          >
            <thead className="table-light">
              <tr>
                <th scope="col">Pessoa</th>
                <th scope="col">Livro e prazo</th>
                <th scope="col">Retirada</th>
                {onNotificar && <th scope="col" className="text-end">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {emprestimos.map((emprestimo) => (
                <tr key={emprestimo.id_emprestimo || emprestimo.id}>
                  <td>{emprestimo.usuario?.name || "Não informado"}</td>
                  <td>
                    <span className="d-block">
                      {emprestimo.livro?.titulo || "Não informado"}
                    </span>
                    <small className="text-muted">
                      Vence: {formatarData(emprestimo.data_prevista_devolucao)}
                    </small>
                  </td>
                  <td className="text-nowrap">
                    {formatarData(emprestimo.data_emprestimo)}
                  </td>
                  {onNotificar && (
                    <td className="text-end">
                      {["aluno", "padrao"].includes(emprestimo.usuario?.role) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary rounded-pill px-2"
                          title={`Criar notificação para ${emprestimo.usuario?.name || "estudante"}`}
                          aria-label={`Criar notificação para ${emprestimo.usuario?.name || "estudante"}`}
                          onClick={() => onNotificar(emprestimo)}
                        >
                          <i className="bi bi-bell" aria-hidden="true"></i>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
