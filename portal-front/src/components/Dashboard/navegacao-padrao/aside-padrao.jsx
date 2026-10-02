import { NavLink, Link } from "react-router"

const navigationItems = [
  { label: "Geral", path: "/dashboard/geral", icon: "bi-house-door-fill" },
  { label: "Biblioteca", path: "/dashboard/biblioteca", icon: "bi-book" },
  { label: "Turmas", path: "/dashboard/turmas", icon: "bi-people-fill" },
  { label: "Agenda", path: "/dashboard/agenda", icon: "bi-calendar-event" },
]

const navigationLinkClass = ({ isActive }) =>
  `nav-link d-flex align-items-center fw-semibold ${isActive ? "active" : "link-dark"}`

const Aside = ({ onLogout }) => {
  return (
    <aside className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm">

      <Link to="/dashboard" className="d-flex align-items-center mb-4 text-decoration-none justify-content-center">
        <div className="text-center">
          <span className="fs-5 fw-bold text-primary d-block">EEPSAS</span>
          <span className="fs-6 text-dark fw-semibold">Ensino Médio</span>
        </div>
      </Link>

      <ul className="nav nav-pills flex-column mb-auto gap-2">
        {navigationItems.map((item) => (
          <li className="nav-item" key={item.path}>
            <NavLink className={navigationLinkClass} to={item.path}>
              <i className={`bi ${item.icon} me-3 fs-5`}></i> {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <br />

      <ul className="nav nav-pills flex-column gap-2 mb-3">
        <li className="nav-item">
          <NavLink className={navigationLinkClass} to="/dashboard/configuracoes">
            <i className="bi bi-gear me-3 fs-5"></i> Configurações
          </NavLink>
        </li>
        <li className="nav-item">
          <button type="button" onClick={onLogout} className="nav-link link-dark d-flex align-items-center fw-semibold border-0 bg-transparent text-start">
            <i className="bi bi-box-arrow-right me-3 fs-5 text-primary"></i> Sair
          </button>
        </li>
      </ul>
    </aside>
  )
}

export default Aside
