import { useState } from "react";
import "./Sobre.css";

import SobreJaguaracu from "./SobreJaguaracu";
import SobreDesenvolvedores from "./SobreDesenvolvedores";
import SobreEepsas from "./SobreEepsas";

const SobreSlider = () => {
  const [current, setCurrent] = useState(0);

  const sections = [
    {
      id: "desenvolvedores",
      label: "Desenvolvedores",
      component: SobreDesenvolvedores,
    },
    {
      id: "jaguaracu",
      label: "Jaguaraçu",
      component: SobreJaguaracu,
    },
    {
      id: "eepsas",
      label: "EEPSAS",
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
              <strong>{section.label}</strong>
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
