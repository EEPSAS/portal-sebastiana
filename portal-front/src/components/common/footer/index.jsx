const Footer = () => {
  return (
    <footer>
      <div className="row shadow bg-black text-white min-vh-100">
        <div className="col-12 col-lg-6 d-flex flex-column justify-content-center p-4">
          <h1 className="text-center text-lg-start">EEPSAS</h1>
          <blockquote className="fs-1 text-center text-lg-start">
            "Nascemos anônimos, para construir nosso Legado."
          </blockquote>
        </div>
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center gap-3 flex-wrap p-4">
          <img className="p-1" src="https://placehold.co/90" alt="Instagram" />

          <img className="p-1" src="https://placehold.co/90" alt="Youtube" />
          <img
            className="p-1"
            src="https://placehold.co/90"
            alt="Portifolios"
          />
        </div>
        <div className="col-12 text-center">
          <img
            className="p-1 img-fluid"
            src="https://placehold.co/600x500"
            alt="CARROSEL COM FOTOS DOS CRIADORES"
          />
          <p>
            &copy; Terceirão 2026 & Projeto legado - todos os nosso direitos
            preservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
