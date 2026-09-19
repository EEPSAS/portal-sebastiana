import { useEffect, useState } from "react";

import fotoEscola from "../../assets/img/fotoescola.jpg";

const slides = [
  {
    src: fotoEscola,
    alt: "Fachada da Escola Estadual Professora Sebastiana",
  },
  {
    src: "https://placehold.co/600x420/ffe7f1/172951?text=Escola",
    alt: "Espaço interno da escola",
  },
  {
    src: "https://placehold.co/600x420/e2f0ff/172951?text=Atividades",
    alt: "Atividades e convivência escolar",
  },
];

const SobreEepsas = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const goTo = (index) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  return (
    <section id="sobre-eepsas" className="sobre-panel">
      <div className="sobre-copy">
        <p className="sobre-eyebrow">Nossa escola</p>
        <h2>Escola Estadual Professora Sebastiana de Almeida e Silva</h2>
        <p className="sobre-description">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Deserunt quam
          veniam quaerat modi nemo, doloremque distinctio libero ullam ut dolor
          cum dignissimos minima nulla. Consectetur blanditiis culpa quos
          explicabo excepturi.
        </p>
        <p className="sobre-note">Educação, comunidade e futuro em um só lugar.</p>
      </div>

      <div className="sobre-gallery sobre-gallery-school" aria-label="Galeria da escola">
        <div className="sobre-gallery-carousel">
          <button
            type="button"
            className="sobre-gallery-button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Imagem anterior da escola"
          >
            <span aria-hidden="true">&#8592;</span>
          </button>

          <div className="sobre-gallery-viewport">
            <div
              className="sobre-gallery-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {slides.map((slide) => (
                <figure key={slide.alt} className="sobre-gallery-slide">
                  <img src={slide.src} alt={slide.alt} />
                </figure>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="sobre-gallery-button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Próxima imagem da escola"
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
        </div>

        <div className="sobre-gallery-dots" role="tablist" aria-label="Selecionar imagem da escola">
          {slides.map((slide, index) => (
            <button
              key={`${slide.alt}-${index}`}
              type="button"
              className={`sobre-gallery-dot${activeIndex === index ? " is-active" : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Selecionar imagem ${index + 1} da escola`}
              aria-selected={activeIndex === index}
              role="tab"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SobreEepsas;
