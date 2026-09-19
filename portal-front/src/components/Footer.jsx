const Footer = () => {
  return (
    <footer className="portal-footer bg-dark text-white py-5">
      <div className="container">
        <div className="row gy-4 align-items-start">
          
          {/* Coluna 1: Logo, Contatos, Endereço e Frase de Impacto */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="border p-2 rounded d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                △
              </span>
              <h2 className="m-0 fw-bold fs-4">EEPSAS</h2>
            </div>

            {/* Ícones de Redes Sociais da Esquerda */}
            <div className="d-flex gap-3 my-2">
              <a href="#facebook" className="text-white border rounded-circle d-flex align-items-center justify-content-center text-decoration-none" style={{ width: '40px', height: '40px' }}>f</a>
              <a href="#twitter" className="text-white border rounded-circle d-flex align-items-center justify-content-center text-decoration-none" style={{ width: '40px', height: '40px' }}>t</a>
              <a href="#instagram" className="text-white border rounded-circle d-flex align-items-center justify-content-center text-decoration-none" style={{ width: '40px', height: '40px' }}>ig</a>
            </div>

            <blockquote className="blockquote fs-6 text-white-50 m-0">
              <p className="mb-1 text-white">escolasebastiana@gmail.com</p>
              <p className="mb-1 text-white">(31) 3456-7890</p>
              <br />
              <p className="mb-1 text-white">eepsas jaguaraçu , Rua são josé n/º30</p>
              <p className="mb-0 text-white">Cidade de Jaguaraçu</p>
            </blockquote>
          </div>

          {/* Coluna 2: Redes Sociais / Textos do Meio e Links */}
          <div className="col-12 col-md-4 d-flex flex-column gap-3">
            <div>
              <p className="mb-1 text-white-50">Siga o:</p>
              <p className="mb-1">Instagram do Terceirão:</p>
              <a href="#instagram-terceirao" className="text-white text-decoration-underline fw-bold">@eepsas26</a>
            </div>

            <div>
              <p className="mb-1">Instagram da escola:</p>
              <a href="#instagram-escola" className="text-white text-decoration-underline fw-bold">@professsorasebastiana</a>
            </div>

            <div className="mt-2">
              <a href="#politicas" className="text-white text-decoration-underline d-block mb-2">Políticas de Privacidade</a>
              <p className="text-white-50 small mb-0">Todos os direitos reservados &copy;2026</p>
            </div>
          </div>

          {/* Coluna 3: Lista de Links da Direita e Selo/Card */}
          <div className="col-12 col-md-4 d-flex flex-column gap-4">
            <ul className="list-unstyled d-flex flex-column gap-2 m-0">
              <li>• Seja um Parceiro</li>
              <li>• Apoie Nosso Projeto</li>
              <li>• Torne-se Patrocinador</li>
              <li>• Faça Parte da Nossa História</li>
              <li>• Junte-se à Turma 2026</li>
            </ul>

            {/* Caixa "BEM VINDO A JAGUARAÇU" */}
            <div className="border border-secondary p-3 text-center rounded bg-secondary bg-opacity-10" style={{ maxWidth: '220px' }}>
              <span className="fw-bold small text-white">BEM VINDO<br />A JAGUARAÇU</span>
            </div>
          </div>

        </div>

        {/* Frase de Impacto Grande na Base */}
        <div className="row mt-5 pt-4 border-top border-secondary">
          <div className="col-12">
            <h1 className="fs-2 fs-lg-1 fst-italic text-white">
              “Nascemos anônimos, para construir nosso Legado.”
            </h1>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;