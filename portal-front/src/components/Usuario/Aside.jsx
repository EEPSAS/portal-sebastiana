import { NavLink, Link } from "react-router"

const navigationItems = [
  { label: "Home", path: "/usuario/home", icon: "bi-house-door-fill" },
  { label: "Biblioteca", path: "/usuario/biblioteca", icon: "bi-book" },
  { label: "Agenda", path: "/usuario/agenda", icon: "bi-calendar-event" },
  { label: "CalendÃ¡rio", path: "/usuario/calendario", icon: "bi-calendar3" },
]

const navigationLinkClass = ({ isActive }) =>
  `nav-link d-flex align-items-center fw-semibold ${isActive ? "active" : "link-dark"}`

const Aside = () => {
  return (
    <aside className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm">

      <Link to="/usuario/home" className="d-flex align-items-center mb-4 text-decoration-none justify-content-center">
        <div className="text-center">
          <span className="fs-5 fw-bold text-primary d-block">EEPSAS</span>
          <span className="fs-6 text-dark fw-semibold">Ensino MÃ©dio</span>
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
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="/usuario">
            <i className="bi bi-bell me-3 fs-5 text-primary"></i> NotificaÃ§Ãµes
          </Link>
        </li>
        <li className="nav-item">
          <NavLink className={navigationLinkClass} to="/usuario/configuracoes">
            <i className="bi bi-gear me-3 fs-5"></i> ConfiguraÃ§Ãµes
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
