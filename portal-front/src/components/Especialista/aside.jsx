import { NavLink, Link } from "react-router";

const EspecialistaAside = () => {
  return (
    <aside className="dashboard-aside d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm" style={{ zIndex: 1040, bottom: 0, top: 0, position: 'fixed' }}>
      <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none px-2">
        <span className="fs-4 fw-bold text-dark">EEPSAS</span>
        <span className="ms-2 fs-6 fw-semibold" style={{ color: '#ef1596' }}>Administrador</span>
      </Link>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        <li className="nav-item">
          <NavLink to="/administrador/home" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-grid-fill me-2"></i>
            Ambiente Virtual
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/administrador/noticias" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-newspaper me-2"></i>
            Notícias
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/administrador/biblioteca" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-book me-2"></i>
            Biblioteca
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/administrador/turmas" className={({ isActive }) => `nav-link ${isActive ? 'text-white' : 'link-dark'}`} style={({ isActive }) => isActive ? { backgroundColor: '#ef1596' } : {}}>
            <i className="bi bi-people-fill me-2"></i>
            Minhas Turmas
          </NavLink>
        </li>
      </ul>
      <hr />
      <ul className="nav nav-pills flex-column gap-2">
        <li className="nav-item">
          <a href="#" className="nav-link link-dark">
            <i className="bi bi-bell me-2"></i>
            Notificações
          </a>
        </li>
        <li className="nav-item">
          <a href="#" className="nav-link link-dark">
            <i className="bi bi-gear me-2"></i>
            Configurações
          </a>
        </li>
        <li className="nav-item">
          <Link to="/" className="nav-link link-danger">
            <i className="bi bi-box-arrow-left me-2"></i>
            Sair
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default EspecialistaAside;
