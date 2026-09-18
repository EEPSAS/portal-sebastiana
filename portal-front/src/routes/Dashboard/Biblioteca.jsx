const resources = [
  { icon: "bi-book", title: "Apostilas", description: "Materiais de apoio para estudo e revisão." },
  { icon: "bi-file-earmark-text", title: "Textos", description: "Conteúdos teóricos e listas de leitura." },
  { icon: "bi-play-circle", title: "Vídeos", description: "Aulas e reforços em formato de vídeo." },
];

const Biblioteca = () => (
  <section className="container-fluid p-4 bg-light min-vh-100">
    <div className="bg-white rounded-4 shadow-sm p-4 p-lg-5">
      <h1 className="h3 text-primary fw-bold mb-2">Biblioteca</h1>
      <p className="text-secondary mb-4">Encontre os materiais disponíveis para apoiar seus estudos.</p>
      <div className="row g-4">
        {resources.map((resource) => (
          <div className="col-md-6 col-xl-4" key={resource.title}>
            <article className="border rounded-4 p-4 h-100">
              <i className={`${resource.icon} text-primary fs-3`} aria-hidden="true" />
              <h2 className="h5 text-dark mt-3">{resource.title}</h2>
              <p className="text-muted mb-0">{resource.description}</p>
            </article>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Biblioteca;
