import fotoEscola from "../../../../assets/img/fotoescola.jpg";

const SobreEepsas = () => {
  return (
    <section id="sobre-eepsas" className="sobre-panel">
      <div className="sobre-copy">
        <p className="sobre-eyebrow">Nossa escola</p>
        <h2>
              Escola Estadual Professora Sebastiana de Almeida e Silva
        </h2>
        <p className="sobre-description">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Deserunt
              quam veniam quaerat modi nemo, doloremque distinctio libero ullam
              ut dolor cum dignissimos minima nulla. Consectetur blanditiis
              culpa quos explicabo excepturi.
        </p>
        <p className="sobre-note">Educação, comunidade e futuro em um só lugar.</p>
      </div>
      <div className="sobre-gallery sobre-gallery-school">
        <img src={fotoEscola} alt="Fachada da Escola Estadual Professora Sebastiana" />
        <img src="https://placehold.co/600x420" alt="Espaço da escola" />
      </div>
    </section>
  );
};

export default SobreEepsas;
