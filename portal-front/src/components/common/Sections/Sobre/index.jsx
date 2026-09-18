import { useState } from "react";

import SobreJaguaracu from "./SobreJaguaracu";
import SobreDesenvolvedores from "./SobreDesenvolvedores";
import SobreEepsas from "./SobreEepsas";

const SobreSlider = () => {
  const [current, setCurrent] = useState(0);

  const sections = [
    {
      id: "jaguaracu",
      label: "Jaguaraçu",
      description: "Nossa cidade",
      component: SobreJaguaracu,
    },
    {
      id: "desenvolvedores",
      label: "Desenvolvedores",
      description: "Quem constrói o portal",
      component: SobreDesenvolvedores,
    },
    {
      id: "eepsas",
      label: "EEPSAS",
      description: "Nossa escola",
      component: SobreEepsas,
    },
  ];

  const ActiveSection = sections[current].component;

  return (
    <section className="sobre-slider" aria-label="Sobre o portal">
      <div className="sobre-heading">
        <p className="sobre-kicker">Conheça o nosso universo</p>
        <h1>
          Quem somos <span>nós?</span>
        </h1>
      </div>

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
            onClick={() => setCurrent(index)}
          >
            <span className="sobre-tab-number">0{index + 1}</span>
            <span>
              <strong>{section.label}</strong>
              <small>{section.description}</small>
            </span>
          </button>
        ))}
      </div>

      <div
        className="sobre-content"
        id={`panel-${sections[current].id}`}
        role="tabpanel"
        aria-labelledby={`tab-${sections[current].id}`}
      >
        <ActiveSection />
      </div>
    </section>
  );
};

export default SobreSlider;
