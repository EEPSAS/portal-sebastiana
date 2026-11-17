import { Link } from "react-router";

/**
 * UsuariosKpisCard.jsx - Linha Superior de KPIs de Governança do Sistema
 */
export default function UsuariosKpisCard({ usuarios = {}, pendencias = {}, sessoesAtivas = 0 }) {
  const kpis = [
    {
      id: "total-usuarios",
      titulo: "Total de Usuários",
      valor: usuarios.total ?? 0,
      subtitulo: `${usuarios.ativos ?? 0} contas ativas no portal`,
      tipoIcone: "bi-people-fill",
      bgIcone: "#e3eefd",
      corIcone: "#1a73e8",
      href: "/dashboard/usuarios",
    },
    {
      id: "pendencias",
      titulo: "Aprovações Pendentes",
      valor: usuarios.pendentes ?? 0,
      subtitulo: `${pendencias.alunos_pendentes ?? 0} alunos • ${pendencias.professores_pendentes ?? 0} docentes`,
      tipoIcone: "bi-person-exclamation",
      bgIcone: (usuarios.pendentes ?? 0) > 0 ? "#fce8ec" : "#e2f5ea",
      corIcone: (usuarios.pendentes ?? 0) > 0 ? "#e6396f" : "#169c4f",
      href: "/dashboard/usuarios?status=pendente",
    },
    {
      id: "status-contas",
      titulo: "Contas Inativas",
      valor: usuarios.inativos ?? 0,
      subtitulo: `${usuarios.ativos ?? 0} ativas de ${usuarios.total ?? 0}`,
      tipoIcone: "bi-person-x-fill",
      bgIcone: "#fff4e5",
      corIcone: "#f59e0b",
      href: "/dashboard/usuarios",
    },
    {
      id: "sessoes",
      titulo: "Sessões Conectadas",
      valor: sessoesAtivas ?? 0,
      subtitulo: "Tokens Sanctum ativos",
      tipoIcone: "bi-shield-lock-fill",
      bgIcone: "#f1e7fa",
      corIcone: "#8435d6",
      href: "/dashboard/configuracoes",
    },
  ];

  return (
    <div className="row g-2 g-md-3 mb-2 flex-shrink-0">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="col-12 col-sm-6 col-lg-3">
          <div className="geral-kpi-card d-flex align-items-center justify-content-between h-100 p-3">
            <div className="d-flex align-items-center gap-3 min-w-0">
              <div
                className="geral-kpi-icon d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: kpi.bgIcone, color: kpi.corIcone, width: 44, height: 44, borderRadius: "50%" }}
                aria-hidden="true"
              >
                <i className={`bi ${kpi.tipoIcone} fs-5`}></i>
              </div>
              <div className="d-flex flex-column min-w-0">
                <span className="geral-kpi-label text-truncate">{kpi.titulo}</span>
                <span className="geral-kpi-value text-truncate">{kpi.valor}</span>
                <small className="text-secondary text-truncate" style={{ fontSize: "0.72rem" }}>
                  {kpi.subtitulo}
                </small>
              </div>
            </div>

            <Link
              to={kpi.href}
              className="geral-kpi-arrow-btn ms-2 flex-shrink-0"
              aria-label={`Abrir ${kpi.titulo}`}
              title={`Abrir ${kpi.titulo}`}
            >
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
