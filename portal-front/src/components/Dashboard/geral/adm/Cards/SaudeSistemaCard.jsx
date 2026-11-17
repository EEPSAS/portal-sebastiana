import { Link } from "react-router";

/**
 * SaudeSistemaCard.jsx - Checklist de Saúde e Consistência das Configurações
 */
export default function SaudeSistemaCard({ saude = [] }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
            style={{ backgroundColor: "var(--dashboard-navy-soft)", width: "36px", height: "36px" }}
            aria-hidden="true"
          >
            <i className="bi bi-heart-pulse-fill fs-6"></i>
          </div>
          <div>
            <h4 className="fs-6 fw-bold mb-0 text-dark">Saúde do Sistema</h4>
            <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
              Consistência de dados acadêmicos e operacionais
            </small>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column gap-2 flex-grow-1 justify-content-around">
        {saude.map((item) => {
          const isOk = item.status === "ok";

          return (
            <div
              key={item.id}
              className="d-flex align-items-center justify-content-between p-2 rounded-3"
              style={{
                backgroundColor: isOk ? "#f8fafc" : "#fff8f6",
                border: `1px solid ${isOk ? "#e2e8f0" : "#fed7aa"}`,
              }}
            >
              <div className="d-flex align-items-center gap-2.5 min-w-0">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    backgroundColor: isOk ? "#e2f5ea" : "#fff4e5",
                    color: isOk ? "#169c4f" : "#f59e0b",
                  }}
                  aria-hidden="true"
                >
                  <i className={`bi ${isOk ? "bi-check-lg" : "bi-exclamation-triangle-fill"}`} style={{ fontSize: "0.85rem" }}></i>
                </span>
                <div className="min-w-0">
                  <span className="d-block fw-semibold text-dark text-truncate small">
                    {item.titulo}
                  </span>
                  <small className="text-secondary text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                    {item.detalhe}
                  </small>
                </div>
              </div>

              {item.destino && (
                <Link
                  to={item.destino}
                  className="btn btn-sm btn-link text-decoration-none p-0 ms-2 text-nowrap fw-semibold"
                  style={{ fontSize: "0.75rem", color: isOk ? "#1a73e8" : "#d97706" }}
                >
                  {isOk ? "Ver" : "Ajustar"} <i className="bi bi-chevron-right" style={{ fontSize: "0.7rem" }}></i>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
