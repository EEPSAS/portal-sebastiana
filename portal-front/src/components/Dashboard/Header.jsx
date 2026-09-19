const Header = () => {
  return (
    <header className="dashboard-header d-flex justify-content-between align-items-start p-4">

      {/* Lado esquerdo: texto de boas-vindas e barra de pesquisa */}
      <div className="d-flex flex-column" style={{ maxWidth: "600px", flex: 1 }}>

        <p className="text-secondary fw-semibold mb-3" style={{ fontSize: "1.1rem" }}>
          Explore materiais, apostilas, videoaulas e muito mais para aprender no seu ritmo.
        </p>

        {/* Input de busca com ícone interno */}
        <div className="position-relative" style={{ maxWidth: "550px" }}>
          <input
            type="text"
            className="form-control rounded-pill border-0 shadow-sm py-2 px-4"
            aria-label="Buscar materiais"
            placeholder="Buscar materiais"
            style={{ backgroundColor: "#ffffff" }}
          />
          <i
            className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3 text-secondary fw-bold"
            aria-hidden="true"
            style={{ cursor: "pointer", zIndex: 10 }}
          ></i>
        </div>

      </div>

      {/* Lado direito: notificações e perfil do usuário */}
      <div className="d-flex align-items-center gap-4 mt-2">

        <button type="button" className="btn btn-link position-relative p-0 text-dark" aria-label="Abrir notificações">
          <i className="bi bi-bell-fill fs-4 text-dark"></i>

          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-circle"
            style={{ backgroundColor: "#ff007f", fontSize: "0.6rem", padding: "0.35em 0.5em" }}
          >
            1
            <span className="visually-hidden">mensagem não lida</span>
          </span>
        </button>

        <button type="button" className="btn btn-link d-flex align-items-center gap-2 p-0 text-decoration-none" aria-label="Abrir menu do perfil">
          <img
            src="https://via.placeholder.com/60"
            alt="Foto de Perfil"
            className="rounded-circle shadow-sm"
            style={{
              width: "55px",
              height: "55px",
              objectFit: "cover",
              border: "3px solid #ff007f" // Borda rosa vibrante do design
            }}
          />
          <i className="bi bi-chevron-down fs-5 fw-bold text-dark" aria-hidden="true"></i>
        </button>

      </div>
    </header>
  );
};

export default Header;
