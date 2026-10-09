const Footer = () => {
  return (
    <footer className="portal-footer">
      <div className="container">
        <div className="row gy-5 align-items-start">
          
          {/* Coluna 1: Logo, Contatos, Endereço e Frase de Impacto */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="portal-footer__brand-icon">
                △
              </span>
              <h2 className="m-0 fw-bold fs-4 text-white">EEPSAS</h2>
            </div>

            {/* Ícones de Redes Sociais da Esquerda */}
            <div className="d-flex gap-3 my-2">
              <a href="#facebook" className="portal-footer__social-btn" aria-label="Facebook">f</a>
              <a href="#twitter" className="portal-footer__social-btn" aria-label="Twitter">t</a>
              <a href="#instagram" className="portal-footer__social-btn" aria-label="Instagram">ig</a>
            </div>

            <blockquote className="blockquote fs-6 text-white-50 m-0">
              <p className="mb-1 text-white">escolasebastiana@gmail.com</p>
              <p className="mb-1 text-white">(31) 3456-7890</p>
              <br />
              <p className="mb-1 text-white">EEPSAS Jaguaraçu, Rua São José nº 30</p>
              <p className="mb-0 text-white">Cidade de Jaguaraçu - MG</p>
            </blockquote>
          </div>

          {/* Coluna 2: Redes Sociais / Textos do Meio e Links */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div>
              <p className="mb-1 text-white-50">Siga o:</p>
              <p className="mb-1 text-white">Instagram do Terceirão:</p>
              <a href="#instagram-terceirao" className="fw-bold">@eepsas26</a>
            </div>

            <div>
              <p className="mb-1 text-white">Instagram da escola:</p>
              <a href="#instagram-escola" className="fw-bold">@professsorasebastiana</a>
            </div>

            <div className="mt-2">
              <a href="#politicas" className="d-block mb-2">Políticas de Privacidade</a>
              <p className="text-white-50 small mb-0">Todos os direitos reservados &copy; 2026</p>
            </div>
          </div>

          {/* Coluna 3: Lista de Links da Direita e Selo/Card */}
          <div className="col-12 col-md-4 d-flex flex-column gap-4">
            <ul className="list-unstyled d-flex flex-column gap-2 m-0 text-white-50">
              <li><a href="#parceiro">• Seja um Parceiro</a></li>
              <li><a href="#apoie">• Apoie Nosso Projeto</a></li>
              <li><a href="#patrocinador">• Torne-se Patrocinador</a></li>
              <li><a href="#historia">• Faça Parte da Nossa História</a></li>
              <li><a href="#turma2026">• Junte-se à Turma 2026</a></li>
            </ul>

            {/* Caixa "BEM VINDO A JAGUARAÇU" */}
            <div className="portal-footer__badge">
              <span className="fw-bold small text-white">BEM-VINDO<br />A JAGUARAÇU</span>
            </div>
          </div>

        </div>

        {/* Frase de Impacto Grande na Base */}
        <div className="portal-footer__quote">
          <div className="col-12 text-center text-md-start">
            <h1 className="m-0">
              “Nascemos anônimos, para construir nosso Legado.”
            </h1>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;