/** Agrupa o destaque mensal da API e o Top 3 demonstrativo solicitado ao backend. */
export default function DestaqueMesCard({
  destaque,
  mesAtual,
  topLivros,
}) {
  return (
    <section
      className="card border-0 dashboard-card-shadow rounded-3 h-100 text-white p-2 p-md-3"
      style={{ backgroundColor: "var(--dashboard-pink)" }}
      aria-label="Destaque do mês e livros mais emprestados"
    >
      <div className="row g-4 h-100">
        <div className="col-12 col-md-5 d-flex flex-column">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <h2 className="h6 fw-bold text-uppercase mb-0">Destaque do mês</h2>
            <span className="small text-white-50 text-capitalize">{mesAtual}</span>
          </div>

          {destaque ? (
            <div className="d-flex align-items-center gap-3 flex-grow-1">
              {destaque.livro.capa_url || destaque.livro.capa ? (
                <img
                  src={destaque.livro.capa_url || destaque.livro.capa}
                  alt={`Capa de ${destaque.livro.titulo}`}
                  className="rounded shadow-sm flex-shrink-0"
                  style={{ width: "76px", height: "108px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "76px",
                    height: "108px",
                    backgroundColor: "rgba(255, 255, 255, 0.18)",
                  }}
                  aria-hidden="true"
                >
                  <i className="bi bi-book fs-2"></i>
                </div>
              )}
              <div className="min-w-0">
                <h3 className="h5 fw-bold mb-1">{destaque.livro.titulo}</h3>
                <p className="small text-white-50 mb-2">
                  {destaque.livro.autor || "Autor não informado"}
                </p>
                <span className="small fw-semibold">
                  {destaque.total}{" "}
                  {destaque.total === 1 ? "empréstimo" : "empréstimos"}
                </span>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-grow-1 align-items-center">
              <p className="small mb-0">
                Ainda não há empréstimos registrados neste mês.
              </p>
            </div>
          )}
        </div>

        <div className="col-12 col-md-7">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
            <h2 className="h6 fw-bold mb-0">Top 3 mais emprestados</h2>
            <span className="badge rounded-pill text-bg-light text-dark">
              Demonstrativo
            </span>
          </div>

          <ol className="list-unstyled d-flex flex-column gap-2 mb-0">
            {topLivros.map((livro, index) => (
              <li
                className="d-flex align-items-center gap-2 rounded-3 px-2 py-2"
                key={livro.livro_id}
                style={{ backgroundColor: "rgba(255, 255, 255, 0.14)" }}
              >
                <span className="badge text-bg-light text-primary">
                  {index + 1}
                </span>
                <span className="small flex-grow-1 text-truncate">
                  {livro.titulo}
                </span>
                <span className="small fw-bold text-nowrap">
                  {livro.total_emprestimos}
                </span>
              </li>
            ))}
          </ol>
          <p className="small text-white-50 mt-2 mb-0">
            O ranking será conectado ao endpoint solicitado ao backend.
          </p>
        </div>
      </div>
    </section>
  );
}
