import { useEffect, useState } from "react";

import areaTerritorial from "../../../../assets/img/area-territorial.png";
import habitantes from "../../../../assets/img/habitantes.png";

const slides = [
  {
    src: "https://placehold.co/600x420/edf7ec/172951?text=Jaguara%C3%A7u",
    alt: "Paisagem de Jaguaraçu",
  },
  {
    src: "https://placehold.co/600x420/fcf3d4/172951?text=Cultura",
    alt: "Cultura de Jaguaraçu",
  },
  {
    src: "https://placehold.co/600x420/f3e2ff/172951?text=Tradi%C3%A7%C3%A3o",
    alt: "Tradições e belezas de Jaguaraçu",
  },
];

const SobreJaguaracu = () => {
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
    <section id="sobre-jaguaracu" className="sobre-panel">
      <div className="sobre-copy">
        <p className="sobre-eyebrow">Nossa cidade</p>
        <h2>Jaguaraçu, MG</h2>
        <p className="sobre-description">
          Localizada no coração Norte de Minas, Jaguaraçu é uma cidade
          acolhedora, rica em cultura, tradições e belezas naturais. Um lugar
          de gente trabalhadora, que valoriza suas raízes e olha para o futuro
          com esperança e união.
        </p>
        <div className="sobre-stats">
          <div className="sobre-stat">
            <img src={habitantes} alt="" />
            <strong>3.092</strong>
            <span>habitantes.</span>
          </div>
          <div className="sobre-stat">
            <img src={areaTerritorial} alt="" />
            <strong>163,76 km²</strong>
            <span>Área Territorial</span>
          </div>
        </div>
      </div>

      <div className="sobre-gallery sobre-gallery-city" aria-label="Galeria de Jaguaraçu">
        <div className="sobre-gallery-carousel">
          <button
            type="button"
            className="sobre-gallery-button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Imagem anterior de Jaguaraçu"
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
            aria-label="Próxima imagem de Jaguaraçu"
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
        </div>

        <div className="sobre-gallery-dots" role="tablist" aria-label="Selecionar imagem de Jaguaraçu">
          {slides.map((slide, index) => (
            <button
              key={`${slide.alt}-${index}`}
              type="button"
              className={`sobre-gallery-dot${activeIndex === index ? " is-active" : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Selecionar imagem ${index + 1} de Jaguaraçu`}
              aria-selected={activeIndex === index}
              role="tab"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SobreJaguaracu;
