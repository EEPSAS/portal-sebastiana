import { useEffect, useRef, useState } from "react";

const developers = [
  "Ana Lívia",
  "Carlos Eduardo",
  "Davi",
  "Natã",
  "Rhaynner",
  "Yasmin Teixeira",
  "Yasmin Gomes",
].map((name) => ({
  name,
  bio: "Construindo ideias com criatividade e colaboração.",
  image: "https://placehold.co/240x240/f9d8eb/172951?text=DEV",
  profile: "https://github.com/",
}));

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.45 11.45 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.76.84 1.23 1.91 1.23 3.22 0 4.62-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
  </svg>
);

const SobreDesenvolvedores = () => {
  const [current, setCurrent] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const maxIndex = Math.max(0, developers.length - cardsPerView);
  const activeIndex = Math.min(current, maxIndex);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth <= 480) {
        setCardsPerView(1);
      } else if (window.innerWidth <= 760) {
        setCardsPerView(2);
      } else if (window.innerWidth <= 1100) {
        setCardsPerView(3);
      } else {
        setCardsPerView(4);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);

    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);

    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || reducedMotion || maxIndex === 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrent((index) => (index >= maxIndex ? 0 : index + 1));
    }, 7000);

    return () => window.clearInterval(interval);
  }, [isPaused, maxIndex, reducedMotion]);

  const goTo = (index) => {
    setCurrent(Math.max(0, Math.min(index, maxIndex)));
  };

  const move = (direction) => {
    setCurrent((index) => {
      if (direction === "next") {
        return index >= maxIndex ? 0 : index + 1;
      }

      return index <= 0 ? maxIndex : index - 1;
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move("next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move("previous");
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(maxIndex);
    }
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    touchStart.current = event.clientX;
    setIsPaused(true);
  };

  const handlePointerUp = (event) => {
    if (touchStart.current === null) {
      return;
    }

    const distance = event.clientX - touchStart.current;
    if (Math.abs(distance) > 40) {
      move(distance < 0 ? "next" : "previous");
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
      <div className="sobre-developers-carousel">
        <button
          className="sobre-carousel-button sobre-carousel-button-previous"
          type="button"
          onClick={() => move("previous")}
          aria-label="Mostrar desenvolvedores anteriores"
        >
          <span aria-hidden="true">&#8592;</span>
        </button>

        <div
          className="sobre-developers-viewport"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div
            className="sobre-developers-grid"
            style={{
              "--visible-cards": cardsPerView,
              transform: `translateX(calc(-${activeIndex} * (100% + 1rem) / var(--visible-cards)))`,
            }}
          >
        {developers.map((developer) => (
          <article
            className="sobre-developer-card"
            key={developer.name}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <img
              className="sobre-developer-photo"
              src={developer.image}
              alt={`Foto de perfil de ${developer.name}`}
            />
            <h3>{developer.name}</h3>
            <p>{developer.bio}</p>
            <a
              className="sobre-developer-link"
              href={developer.profile}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir GitHub de ${developer.name}`}
            >
              <GithubIcon />
              <span>GitHub</span>
            </a>
          </article>
        ))}
          </div>
        </div>

        <button
          className="sobre-carousel-button sobre-carousel-button-next"
          type="button"
          onClick={() => move("next")}
          aria-label="Mostrar próximos desenvolvedores"
        >
          <span aria-hidden="true">&#8594;</span>
        </button>
      </div>

      <div className="sobre-carousel-dots" role="tablist" aria-label="Selecionar grupo de desenvolvedores">
        {Array.from({ length: maxIndex + 1 }, (_, index) => (
          <button
            className={`sobre-carousel-dot${activeIndex === index ? " is-active" : ""}`}
            key={index}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-label={`Mostrar grupo ${index + 1} de ${maxIndex + 1}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default SobreDesenvolvedores;
