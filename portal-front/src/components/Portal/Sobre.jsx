import { useState } from "react";

import habitantes from "../../../../assets/img/habitantes.png";
import fotoEscola from "../../../../assets/img/fotoescola.jpg";

import SobreJaguaracu from "./SobreJaguaracu";
import SobreDesenvolvedores from "./SobreDesenvolvedores";
import SobreEepsas from "./SobreEepsas";

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
    <>
    <section id="Sobre-nos" className="py-5">
          <div className="container">
            <div className="row align-items-center g-4">
              <div className="col-12 col-lg-6 order-lg-1">
                <h1 className="mb-3">Quem somos nós</h1>
                <h2 className="mb-3">Jaguaraçu,MG</h2>
                <p className="mb-4">Localizada no coração Norte de Minas , Jaguaraçu é uma cidade acolhedora, rica em cultura , tradições e belezas naturais. Um lugar de gente trabalhadora, que valoriza suas raízes e olha para o futuro com esperança e união.</p>
                <div className="d-flex gap-2 flex-wrap">
                  <img className="p-1 img-fluid" src="https://placehold.co/200x150" alt="Habitantes" />
                  <img className="p-1 img-fluid" src="https://placehold.co/200x150" alt="Area territorial" />
                </div>
              </div>
              <div className="col-12 col-lg-6 order-lg-2">
                <img className="img-fluid w-100" src="https://placehold.co/500" alt="" />
              </div>
            </div>
          </div>
        </section>
    
    </>
  )
}

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
    </section>
  );
};

export default SobreSlider;
