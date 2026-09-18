import { NavLink, Link } from "react-router"

const navigationItems = [
  { label: "Home", path: "/dashboard/home", icon: "bi-house-door-fill" },
  { label: "Biblioteca", path: "/dashboard/biblioteca", icon: "bi-book" },
  { label: "Agenda", path: "/dashboard/agenda", icon: "bi-calendar-event" },
  { label: "Calendário", path: "/dashboard/calendario", icon: "bi-calendar3" },
]

const navigationLinkClass = ({ isActive }) =>
  `nav-link d-flex align-items-center fw-semibold ${isActive ? "active" : "link-dark"}`

const Aside = () => {
  return (
    <aside className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm">
      
      <Link to="/dashboard/home" className="d-flex align-items-center mb-4 text-decoration-none justify-content-center">
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
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="/dashboard">
            <i className="bi bi-bell me-3 fs-5 text-primary"></i> Notificações
          </Link>
        </li>
        <li className="nav-item">
          <NavLink className={navigationLinkClass} to="/dashboard/configuracoes">
            <i className="bi bi-gear me-3 fs-5"></i> Configurações
          </NavLink>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="/">
            <i className="bi bi-box-arrow-right me-3 fs-5 text-primary"></i> Sair
          </Link>
        </li>
      </ul>
    </aside>
  )
}

export default Aside