import { Link, useLocation } from "react-router"


const NavBar = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <header className="portal-header">
      <div className="portal-header__topbar">
        <div className="container d-flex justify-content-end">
          <Link className="portal-header__student-link" to="login">
            Portal do Aluno
          </Link>
        </div>
      </div>
      <nav className="navbar navbar-expand-lg portal-navbar">
        <div className="container portal-navbar__inner">
          <Link className="navbar-brand portal-brand" to="/">
            <span className="portal-brand__eyebrow">E.E. Prof. Sebastiana de</span>
            <span className="portal-brand__name">Almeida e Silva</span>
          </Link>
          <button
            className="navbar-toggler portal-navbar__toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Abrir menu de navegação"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-4">
              {isLoginPage ? (
                <li className="nav-item">
                  <Link className="nav-link portal-nav-link" to="/">Página Inicial</Link>
                </li>
              ) : (
                <>
                  <li className="nav-item"><a className="nav-link portal-nav-link" href="#Noticias">Notícias</a></li>
                  <li className="nav-item"><a className="nav-link portal-nav-link" href="#calendario">Calendário</a></li>
                  <li className="nav-item"><a className="nav-link portal-nav-link" href="#podcast">Podcast</a></li>
                  <li className="nav-item"><a className="nav-link portal-nav-link" href="#Sobre-nos">Sobre Nós</a></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default NavBar