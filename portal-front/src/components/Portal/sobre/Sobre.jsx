import { useState } from "react";

import SobreJaguaracu from "./SobreJaguaracu";
import SobreDesenvolvedores from "./SobreDesenvolvedores";
import SobreEepsas from "./SobreEepsas";

const habitantes = "/img/habitantes.png";
const fotoEscola = "/img/fotoescola.jpg";

const SobreSlider = () => {
  const [current, setCurrent] = useState(0);

  const sections = [
    {
      id: "jaguaracu",
      label: "Jaguaraçu",
      image: habitantes,
      component: SobreJaguaracu,
    },
    {
      id: "desenvolvedores",
      label: "Desenvolvedores",
      image: "https://placehold.co/96x96/f9d8eb/172951?text=DEV",
      component: SobreDesenvolvedores,
    },
    {
      id: "eepsas",
      label: "EEPSAS",
      image: fotoEscola,
      component: SobreEepsas,
    },
  ];

  const ActiveSection = sections[current].component;

  const selectSection = (index) => setCurrent(index);

  const handleTabKeyDown = (event, index) => {
    let nextIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % sections.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + sections.length) % sections.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = sections.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    selectSection(nextIndex);
    document.getElementById(`tab-${sections[nextIndex].id}`)?.focus();
  };

  return (
    <section id="Sobre-nos" className="py-5">
      <div className="container">
        <div className="sobre-tabs" role="tablist" aria-label="Sobre">
          {sections.map((section, index) => (
            <button
              className={`sobre-tab${current === index ? " is-active" : ""}`}
              key={section.id}
              id={`tab-${section.id}`}
              type="button"
              role="tab"
              aria-selected={current === index}
              aria-controls={`panel-${section.id}`}
              tabIndex={current === index ? 0 : -1}
              onClick={() => selectSection(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <img className="sobre-tab-thumb" src={section.image} alt="" />
              <span>
                <strong>{section.label}</strong>
              </span>
            </button>
          ))}
        </div>

        <div
          key={sections[current].id}
          className="sobre-content"
          id={`panel-${sections[current].id}`}
          role="tabpanel"
          aria-labelledby={`tab-${sections[current].id}`}
        >
          <ActiveSection />
        </div>
      </div>
    </section>
  );
};

export default SobreSlider;
