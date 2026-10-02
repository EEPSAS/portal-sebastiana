import { NavLink, Link } from "react-router";

const EspecialistaAside = ({ onLogout }) => {
  return (
    <aside className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm" style={{ zIndex: 1040, bottom: 0, top: 0, position: 'fixed' }}>
      <Link to="/dashboard" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none px-2">
        <span className="fs-4 fw-bold text-dark">EEPSAS</span>
        <span className="ms-2 fs-6 fw-semibold" style={{ color: '#ef1596' }}>Especialista</span>
      </Link>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        <li className="nav-item">
          <NavLink to="/dashboard/geral" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-grid-fill me-2"></i>
            Geral
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/dashboard/biblioteca" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-book me-2"></i>
            Biblioteca
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/dashboard/turmas" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-people-fill me-2"></i>
            Turmas
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/dashboard/configuracoes" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-gear me-2"></i>
            Configurações
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/dashboard/agenda" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-calendar-event me-2"></i>
            Agenda
          </NavLink>
        </li>
      </ul>
      <hr />
      <ul className="nav nav-pills flex-column gap-2">
        <li className="nav-item">
          <button type="button" onClick={onLogout} className="nav-link link-danger border-0 bg-transparent text-start">
            <i className="bi bi-box-arrow-left me-2"></i>
            Sair
          </button>
        </li>
      </ul>
    </aside>
  );
};

export default EspecialistaAside;
