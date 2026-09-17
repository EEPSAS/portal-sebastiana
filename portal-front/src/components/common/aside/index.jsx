import { Link } from "react-router"

const Aside = () => {
  return (
    <aside className="d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm vh-100" style={{ width: "250px", borderRadius: "0 20px 20px 0" }}>
      
      {/* Logo / Cabeçalho do Aside */}
      <Link to="/" className="d-flex align-items-center mb-4 text-decoration-none justify-content-center">
        <div className="text-center">
          <span className="fs-5 fw-bold text-primary d-block">EEPSAS</span>
          <span className="fs-6 text-dark fw-semibold">Ensino Médio</span>
        </div>
      </Link>

      {/* Menu Principal (Superior) */}
      <ul className="nav nav-pills flex-column mb-auto gap-2">
        <li className="nav-item">
          <Link className="nav-link active d-flex align-items-center fw-semibold" aria-current="page" to="#">
            <i className="bi bi-house-door-fill me-3 fs-5"></i> Ambiente Virtual
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-folder me-3 fs-5 text-primary"></i> Disciplinas
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-file-eartext me-3 fs-5 text-primary"></i> Atividades
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-book me-3 fs-5 text-primary"></i> Biblioteca
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-calendar-event me-3 fs-5 text-primary"></i> Agenda
          </Link>
        </li>
      </ul>

      <br />

      {/* Menu Secundário (Inferior) */}
      <ul className="nav nav-pills flex-column gap-2 mb-3">
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-bell me-3 fs-5 text-primary"></i> Notificações
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-person me-3 fs-5 text-primary"></i> Perfil
          </Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link link-dark d-flex align-items-center fw-semibold" to="#">
            <i className="bi bi-box-arrow-right me-3 fs-5 text-primary"></i> Sair
          </Link>
        </li>
      </ul>
    </aside>
  )
}

export default Aside