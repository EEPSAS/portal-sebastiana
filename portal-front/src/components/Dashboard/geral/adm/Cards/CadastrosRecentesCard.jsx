import { Link } from "react-router";

const MAPA_CORES_ROLE = {
  aluno: { bg: "#e3eefd", color: "#1a73e8", label: "Aluno" },
  professor: { bg: "#e2f5ea", color: "#169c4f", label: "Professor" },
  especialista: { bg: "#fff4e5", color: "#f59e0b", label: "Especialista" },
  bibliotecaria: { bg: "#f1e7fa", color: "#8435d6", label: "Bibliotecária" },
  adm: { bg: "#e2e8f0", color: "#0d2346", label: "Admin" },
};

/**
 * CadastrosRecentesCard.jsx - Feed dos Últimos Cadastros Realizados no Sistema
 */
export default function CadastrosRecentesCard({ cadastros = [] }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom flex-shrink-0">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
            style={{ backgroundColor: "var(--dashboard-navy-soft)", width: "36px", height: "36px" }}
            aria-hidden="true"
          >
            <i className="bi bi-clock-history fs-6"></i>
          </div>
          <div>
            <h4 className="fs-6 fw-bold mb-0 text-dark">Últimos Cadastros</h4>
            <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
              Atividade recente de novos usuários registrados
            </small>
          </div>
        </div>
        <Link
          to="/dashboard/usuarios"
          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          style={{ fontSize: "0.78rem" }}
        >
          Ver Todos
        </Link>
      </div>

      {cadastros.length === 0 ? (
        <div className="text-muted small text-center py-4 flex-grow-1 d-flex align-items-center justify-content-center">
          Nenhum cadastro recente registrado.
        </div>
      ) : (
        <div
          className="flex-grow-1 min-h-0"
          style={{ overflowY: "auto", scrollbarGutter: "stable", scrollbarWidth: "thin" }}
        >
          <div className="d-flex flex-column">
            {cadastros.map((user) => {
              const roleInfo = MAPA_CORES_ROLE[user.role] || {
                bg: "#f1f5f9",
                color: "#64748b",
                label: user.role,
              };
              const isPendente = user.status_confirmacao === "pendente";

              return (
                <div
                  key={user.id}
                  className="d-flex align-items-center justify-content-between p-2 rounded-3 border-bottom"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <div className="d-flex align-items-center gap-2.5 min-w-0">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "var(--dashboard-navy, #0d2346)",
                        fontSize: "0.78rem",
                      }}
                      aria-hidden="true"
                    >
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="d-block fw-semibold text-dark text-truncate small">
                        {user.name}
                      </span>
                      <small className="text-secondary text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                        {user.email || "Sem e-mail"}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                    <span
                      className="badge rounded-pill fw-semibold"
                      style={{
                        backgroundColor: roleInfo.bg,
                        color: roleInfo.color,
                        fontSize: "0.72rem",
                      }}
                    >
                      {roleInfo.label}
                    </span>
                    {isPendente ? (
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill" style={{ fontSize: "0.7rem" }}>
                        Pendente
                      </span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: "0.7rem" }}>
                        Ativo
                      </span>
                    )}
                    <span className="text-muted small text-nowrap" style={{ fontSize: "0.72rem" }}>
                      {user.tempoAtras || ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
