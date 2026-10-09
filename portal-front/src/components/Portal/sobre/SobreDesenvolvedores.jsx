import { useEffect, useRef, useState } from "react";

const developers = [
  "Ana Lívia",
  "Yasmin Teixeira",
  "Yasmim Gomes",
  "Carlos Eduardo",
  "Rhaynner",
  "Prentys",
  "Dalton",
  "Davi",
  "Natã",
].map((name) => ({
  name,
  role: "Desenvolvimento · Front-end",
  profile: "https://github.com/",
}));

const cardsPerPage = 3;
const pageCount = Math.ceil(developers.length / cardsPerPage);

const getInitials = (name) => {
  const parts = name.split(" ");
  const initials = parts.length > 1
    ? parts.slice(0, 2).map((part) => part[0]).join("")
    : name.slice(0, 2);

  return initials.toLocaleUpperCase("pt-BR");
};

const SobreDesenvolvedores = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const visibleDevelopers = developers.slice(
    current * cardsPerPage,
    (current + 1) * cardsPerPage,
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);

    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || reducedMotion) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrent((index) => (index + 1) % pageCount);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [isPaused, reducedMotion]);

  const move = (direction) => {
    setCurrent((index) => (
      (index + direction + pageCount) % pageCount
    ));
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setCurrent(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setCurrent(pageCount - 1);
    }
  };

  const handlePointerDown = (event) => {
    touchStart.current = event.clientX;
    setIsPaused(true);
  };

  const handlePointerUp = (event) => {
    if (touchStart.current === null) {
      return;
    }

    const distance = event.clientX - touchStart.current;
    if (Math.abs(distance) > 40) {
      move(distance < 0 ? 1 : -1);
    }

    touchStart.current = null;
    setIsPaused(false);
  };

  const handlePointerCancel = () => {
    touchStart.current = null;
    setIsPaused(false);
  };

  return (
    <section
      id="sobre-desenvolvedores"
      className="sobre-panel sobre-developers-panel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Desenvolvedores do portal"
      onKeyDown={handleKeyDown}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="sobre-developers-intro">
        <p className="sobre-eyebrow">Quem faz o portal</p>
        <h2>Desenvolvedores</h2>
        <p className="sobre-developers-tagline">
          que transformam ideias em código.
        </p>
        <p className="sobre-developers-description">
          Conheça as pessoas que construíram este portal para aproximar a escola
          de sua comunidade.
        </p>
        <span className="sobre-developers-code" aria-hidden="true">&lt; portal &gt;</span>
      </div>

      <div
        className="sobre-developers-feature"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="sobre-developers-carousel">
          <button
            className="sobre-carousel-button sobre-carousel-button-previous"
            type="button"
            onClick={() => move(-1)}
            aria-label="Mostrar desenvolvedor anterior"
          >
            <span aria-hidden="true">&#8592;</span>
          </button>

          <div className="sobre-developers-cards" aria-live="polite">
            {visibleDevelopers.map((developer, index) => {
              const developerNumber = current * cardsPerPage + index + 1;

              return (
                <article className="sobre-developer-card" key={developer.name}>
                  <div className="sobre-developer-card-meta">
                    <span>
                      <strong>{String(developerNumber).padStart(2, "0")}</strong>
                      <span aria-hidden="true"> · </span>
                      DEV
                    </span>
                    <span className="sobre-developer-count" aria-hidden="true">
                      {String(developerNumber).padStart(2, "0")} / {String(developers.length).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="sobre-developer-initials" aria-hidden="true">
                    {getInitials(developer.name)}
                  </div>

                  <div className="sobre-developer-info">
                    <h3 title={developer.name}>{developer.name}</h3>
                    <p title={developer.role}>{developer.role}</p>
                    <a
                      className="sobre-developer-link"
                      href={developer.profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir GitHub de ${developer.name}`}
                    >
                      <span>GitHub</span>
                      <span aria-hidden="true">&#8594;</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            className="sobre-carousel-button sobre-carousel-button-next"
            type="button"
            onClick={() => move(1)}
            aria-label="Mostrar próximo desenvolvedor"
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
        </div>

        <div className="sobre-carousel-dots" role="tablist" aria-label="Selecionar página de desenvolvedores">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              className={`sobre-carousel-dot${current === index ? " is-active" : ""}`}
              key={index}
              type="button"
              role="tab"
              aria-selected={current === index}
              aria-label={`Mostrar página ${index + 1} de ${pageCount}`}
              onClick={() => setCurrent(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SobreDesenvolvedores;
