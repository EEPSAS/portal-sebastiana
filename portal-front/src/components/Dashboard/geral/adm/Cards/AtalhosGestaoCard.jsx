import { Link } from "react-router";

/**
 * AtalhosGestaoCard.jsx - Acessos Rápidos de Gestão do Sistema
 */
export default function AtalhosGestaoCard() {
  const atalhos = [
    {
      titulo: "Gestão de Usuários",
      subtitulo: "Aprovações, senhas e vínculos",
      icone: "bi-people",
      cor: "#1a73e8",
      href: "/dashboard/usuarios",
    },
    {
      titulo: "Turmas & Matrículas",
      subtitulo: "Acompanhamento e enturmação",
      icone: "bi-mortarboard",
      cor: "#0d2346",
      href: "/dashboard/turmas",
    },
    {
      titulo: "Períodos Letivos",
      subtitulo: "Divisões e etapas avaliativas",
      icone: "bi-calendar3",
      cor: "#169c4f",
      href: "/dashboard/periodos-letivos",
    },
    {
      titulo: "Assistente Dona Nana",
      subtitulo: "Persona, prompt e diretrizes",
      icone: "bi-robot",
      cor: "#8435d6",
      href: "/dashboard/dona-nana/configuracao",
    },
  ];

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center p-2 text-primary"
          style={{ backgroundColor: "var(--dashboard-navy-soft)", width: "36px", height: "36px" }}
          aria-hidden="true"
        >
          <i className="bi bi-grid-fill fs-6"></i>
        </div>
        <div>
          <h4 className="fs-6 fw-bold mb-0 text-dark">Acessos Rápidos</h4>
          <small className="text-secondary" style={{ fontSize: "0.75rem" }}>
            Atalhos para módulos administrativos centrais
          </small>
        </div>
      </div>

      <div className="row g-2 flex-grow-1 align-content-around">
        {atalhos.map((a) => (
          <div key={a.titulo} className="col-12 col-sm-6">
            <Link
              to={a.href}
              className="d-flex align-items-center gap-2.5 p-2.5 rounded-3 text-decoration-none border h-100 transition"
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
              }}
            >
              <span
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: `${a.cor}15`,
                  color: a.cor,
                }}
              >
                <i className={`bi ${a.icone} fs-5`}></i>
              </span>
              <div className="min-w-0">
                <span className="d-block fw-semibold text-dark text-truncate small">
                  {a.titulo}
                </span>
                <small className="text-secondary text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                  {a.subtitulo}
                </small>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
