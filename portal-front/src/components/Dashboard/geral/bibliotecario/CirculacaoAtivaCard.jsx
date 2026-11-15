import { Link } from "react-router";
import IndicadorTooltip from "../../../common/IndicadorTooltip";
import { DESCRICOES_INDICADORES } from "../../../common/descricoesIndicadores";

/** Combina a contagem real de circulação com as devoluções mais recentes da API. */
export default function CirculacaoAtivaCard({
  quantidadeAtiva,
  devolucoesRecentes,
  formatarData,
}) {
  return (
    <section
      className="card border-0 dashboard-card-shadow rounded-3 h-100 p-2 p-md-3"
      style={{ backgroundColor: "var(--dashboard-amber)" }}
      aria-label="Circulação ativa e devoluções recentes"
    >
      <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 h-100">
        <div className="d-flex flex-column justify-content-center flex-shrink-0">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <IndicadorTooltip
                titulo={DESCRICOES_INDICADORES.biblioteca_circulacao.titulo}
                texto={DESCRICOES_INDICADORES.biblioteca_circulacao.texto}
              >
                <span
                  className="badge rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "rgba(var(--dashboard-navy-rgb), 0.12)",
                    color: "var(--dashboard-navy)",
                    width: "28px",
                    height: "28px",
                  }}
                  aria-hidden="true"
                >
                  <i className="bi bi-book fs-6"></i>
                </span>
              </IndicadorTooltip>
              <span className="small fw-semibold text-uppercase">
                Circulação ativa
              </span>
            </div>
            <Link
              to="/dashboard/biblioteca?tab=circulacao"
              className="geral-kpi-arrow-btn geral-kpi-arrow-btn--sm ms-2"
              aria-label="Abrir Circulação e Empréstimos da Biblioteca"
              title="Abrir Circulação e Empréstimos"
            >
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>
          <strong className="display-4 lh-1 my-2">{quantidadeAtiva}</strong>
          <span className="small">empréstimos ativos</span>
        </div>

        <div className="border-start border-dark border-opacity-10 ps-3 flex-grow-1">
          <h2 className="h6 fw-bold mb-2">Devoluções recentes</h2>
          {devolucoesRecentes.length > 0 ? (
            <div className="table-responsive">
              <table
                className="table table-sm align-middle mb-0"
                style={{
                  "--bs-table-bg": "var(--dashboard-amber)",
                  "--bs-table-color": "var(--dashboard-navy)",
                  "--bs-table-border-color": "rgba(var(--dashboard-navy-rgb), 0.22)",
                }}
              >
                <thead>
                  <tr>
                    <th scope="col">Pessoa</th>
                    <th scope="col">Livro</th>
                    <th scope="col">Devolvido</th>
                  </tr>
                </thead>
                <tbody>
                  {devolucoesRecentes.slice(0, 3).map((emprestimo) => (
                    <tr key={emprestimo.id_emprestimo || emprestimo.id}>
                      <td className="text-truncate" style={{ maxWidth: "100px" }}>
                        {emprestimo.usuario?.name || "Não informado"}
                      </td>
                      <td className="text-truncate" style={{ maxWidth: "130px" }}>
                        {emprestimo.livro?.titulo || "Não informado"}
                      </td>
                      <td className="text-nowrap">
                        {formatarData(emprestimo.data_devolucao_real)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="small mb-0">Ainda não há devoluções registradas.</p>
          )}
        </div>
      </div>
    </section>
  );
}
