import { Link } from "react-router";

/**
 * DistribuicaoPerfisCard.jsx - Painel de Distribuição de Contas por Perfil
 */
export default function DistribuicaoPerfisCard({ porPerfil = {}, total = 0 }) {
  const perfisConfig = [
    { chave: "aluno", rotulo: "Estudantes", cor: "#1a73e8", icone: "bi-mortarboard-fill" },
    { chave: "professor", rotulo: "Professores", cor: "#169c4f", icone: "bi-person-badge-fill" },
    { chave: "especialista", rotulo: "Especialistas", cor: "#f59e0b", icone: "bi-journal-check" },
    { chave: "bibliotecaria", rotulo: "Bibliotecárias", cor: "#8435d6", icone: "bi-book-half" },
    { chave: "adm", rotulo: "Administradores", cor: "#0d2346", icone: "bi-gear-wide-connected" },
  ];

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
            style={{ backgroundColor: "var(--dashboard-navy-soft)", width: "36px", height: "36px" }}
            aria-hidden="true"
          >
            <i className="bi bi-pie-chart-fill fs-6"></i>
          </div>
          <div>
            <h4 className="fs-6 fw-bold mb-0 text-dark">Distribuição de Contas</h4>
            <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
              Composição da comunidade escolar cadastrada
            </small>
          </div>
        </div>
        <Link
          to="/dashboard/usuarios"
          className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
          style={{ fontSize: "0.78rem" }}
        >
          Gerenciar Usuários
        </Link>
      </div>

      <div className="d-flex flex-column gap-2.5 flex-grow-1 justify-content-around">
        {perfisConfig.map((p) => {
          const qtd = Number(porPerfil[p.chave] ?? 0);
          const percentual = total > 0 ? (qtd / total) * 100 : 0;

          return (
            <div key={p.chave} className="d-flex flex-column gap-1">
              <div className="d-flex align-items-center justify-content-between small">
                <span className="fw-semibold text-dark d-flex align-items-center gap-1.5">
                  <i className={`bi ${p.icone}`} style={{ color: p.cor }}></i>
                  {p.rotulo}
                </span>
                <span className="text-muted fw-medium" style={{ fontSize: "0.8rem" }}>
                  <strong className="text-dark">{qtd}</strong> ({percentual.toFixed(0)}%)
                </span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label={p.rotulo}
                aria-valuenow={percentual}
                aria-valuemin="0"
                aria-valuemax="100"
                style={{ height: "6px", backgroundColor: "#eef2f7" }}
              >
                <div
                  className="progress-bar rounded-pill"
                  style={{
                    width: `${percentual}%`,
                    backgroundColor: p.cor,
                    transition: "width 0.4s ease",
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
