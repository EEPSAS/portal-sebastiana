

import fotoEscola from '../../assets/img/fotoescola.jpg';

const HeroSection = () => {
  return (
    <section id="Hero" className="portal-hero">
      <div className="container portal-hero__container">
        <div className="portal-hero__showcase">
          <div className="portal-hero__image-frame">
            <img
              className="portal-hero__image"
              src={fotoEscola}
              alt="Fachada da Escola Estadual Professor Sebastiana de Almeida e Silva"
            />
            <p className="portal-hero__message">
              Fique por dentro de todas as novidades da escola e personalize seu
              próprio calendário melhorando seu desempenho escolar e saúde mental
            </p>
          </div>

          <div id="heroCarousel" className="carousel slide portal-hero__carousel" data-bs-ride="carousel">
            <div className="carousel-indicators">
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Primeiro slide" />
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Segundo slide" />
            </div>
            <div className="carousel-inner portal-hero__carousel-inner">
              <div className="carousel-item active">
                <img
                  src="https://placehold.co/900x675/e7ebf2/263864?text=Novidades+da+Escola"
                  className="portal-hero__carousel-image"
                  alt="Placeholder para novidades da escola"
                />
              </div>
              <div className="carousel-item">
                <img
                  src="https://placehold.co/900x675/dce3ef/263864?text=Projetos+e+Eventos"
                  className="portal-hero__carousel-image"
                  alt="Placeholder para projetos e eventos da escola"
                />
              </div>
            </div>
            <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Anterior</span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Próximo</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;