const developers = [
  "Ana Lívia",
  "Carlos Eduardo",
  "Davi",
  "Rhaynner",
  "Yasmin Teixeira",
  "Natã",
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
  return (
    <section
      id="sobre-desenvolvedores"
      className="sobre-panel sobre-developers-panel"
    >
      <div className="sobre-developers-grid">
        {developers.map((developer) => (
          <article className="sobre-developer-card" key={developer.name}>
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
    </section>
  );
};

export default SobreDesenvolvedores;
