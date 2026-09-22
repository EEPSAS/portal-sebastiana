const Header = () => {
  return (
    <header className="dashboard-header d-flex justify-content-between align-items-start p-4">

      {/* Lado Esquerdo: Texto de Boas-vindas e Barra de Pesquisa */}
      <div className="d-flex flex-column" style={{ maxWidth: "600px", flex: 1 }}>

        <p className="text-secondary fw-semibold mb-3" style={{ fontSize: "1.1rem" }}>
          Explore materiais, apostilas, videoaulas e muito mais para aprender no seu ritmo.
        </p>

        {/* Input de Busca com Ãcone Interno */}
        <div className="position-relative" style={{ maxWidth: "550px" }}>
          <input
            type="text"
            className="form-control rounded-pill border-0 shadow-sm py-2 px-4"
            style={{ backgroundColor: "#ffffff" }}
          />
          {/* O zIndex garante que o Ã­cone fique acima do input */}
          <i
            className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3 text-secondary fw-bold"
            style={{ cursor: "pointer", zIndex: 10 }}
          ></i>
        </div>

      </div>

      {/* Lado Direito: Sino de NotificaÃ§Ã£o e Perfil do UsuÃ¡rio */}
      <div className="d-flex align-items-center gap-4 mt-2">

        {/* Ãcone de Sino com Badge de NotificaÃ§Ã£o */}
        <div className="position-relative" style={{ cursor: "pointer" }}>
          <i className="bi bi-bell-fill fs-4 text-dark"></i>

          {/* Bolinha rosa de notificaÃ§Ã£o */}
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-circle"
            style={{ backgroundColor: "#ff007f", fontSize: "0.6rem", padding: "0.35em 0.5em" }}
          >
            1
            <span className="visually-hidden">mensagens nÃ£o lidas</span>
          </span>
        </div>

        {/* Foto de Perfil e Seta */}
        <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
          <img
            // Substitua o 'src' abaixo pela imagem real ou variÃ¡vel do seu estado
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
          <i className="bi bi-chevron-down fs-5 fw-bold text-dark"></i>
        </div>

      </div>
    </header>
  );
};

export default Header;
