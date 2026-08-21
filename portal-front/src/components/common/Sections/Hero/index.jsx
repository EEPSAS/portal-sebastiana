

const HeroSection = () => {
  return (
    <section id="Hero" className="min-vh-100 bg-light d-flex align-items-center py-5">
      <div className="container py-lg-5">
        <div className="row align-items-center flex-column-reverse flex-lg-row g-5">
          
          {/* Coluna de Texto (Adicionada para Padrão de Mercado) */}
          <div className="col-12 col-lg-5 text-center text-lg-start">
            <h1 className="display-4 fw-bold text-dark mb-4">
              O Legado Começa Aqui
            </h1>
            <p className="lead text-secondary mb-5">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
              <button type="button" className="btn btn-primary btn-lg px-5 py-3 fw-semibold shadow-sm">
                Nossos Cursos
              </button>
              <button type="button" className="btn btn-outline-dark btn-lg px-5 py-3 fw-semibold">
                Saber Mais
              </button>
            </div>
          </div>

          {/* Coluna da Imagem (Conteúdo Preservado e Ajustado) */}
          <div className="col-12 col-lg-7 text-center">
            {/* O alt diz "texto ao lado", então apliquei a imagem ao lado do texto no Grid */}
            <img 
              className="img-fluid w-100 rounded-4 shadow-lg object-fit-cover" 
              src="https://placehold.co/1900x800" 
              alt="Foto da escola com texto ao lado"
              style={{ maxHeight: '600px' }} // Única exceção inline aceitável no Bootstrap para limitar a altura de um placeholder gigante, mas idealmente resolvido no corte da imagem real.
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;