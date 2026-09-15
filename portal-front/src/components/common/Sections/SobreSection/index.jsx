import { useState } from "react";

import SobreJaguaracu from "./SobreJaguaracu";
import SobreDesenvolvedores from "./SobreDesenvolvedores";
import SobreEepsas from "./SobreEepsas";

const SobreSlider = () => {
  const [current, setCurrent] = useState(0);

  const components = [
    <SobreJaguaracu />,
    <SobreDesenvolvedores />,
    <SobreEepsas />,
  ];

  const next = () => {
    setCurrent((prev) => (prev + 1) % components.length);
  };

  const previous = () => {
    setCurrent((prev) => (prev - 1 + components.length) % components.length);
  };

  return (
    <section className="sobre-slider">
      <button
        className="slider-button slider-button-left"
        onClick={previous}
        aria-label="Anterior"
      >
        ←
      </button>

      <div className="slider-content">{components[current]}</div>

      <button
        className="slider-button slider-button-right"
        onClick={next}
        aria-label="Próximo"
      >
        →
      </button>
    </section>
  );
};

export default SobreSlider;
