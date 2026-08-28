

const PodcastSection = () => {
  return (
    <>
     <section id="radioatividade" className="min-vh-100 py-5">
          <div className="container">
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-6 order-lg-1">
                <span className="text-muted">podcast do terceirão</span>
                <h1 className="my-3">Radioatividade</h1>
                <blockquote className="mb-3">Vozes que informam, ideias que transformam</blockquote>
                <p className="mb-4">A Radioatividade é o podcast oficial do Terceirão 2026, produzido pelos próprios alunos para falar sobre temas que importam: educação,carreira,sociedade,ciência e muito mais.</p>
                <button className="btn btn-primary mb-4">Saiba mais sobre o projeto</button>
                <h2 className="mb-3">Conheça a radioatividade</h2>
                <div className="d-flex gap-2 flex-wrap">
                  <img className="p-1 img-fluid" src="https://placehold.co/200" alt="" />
                  <img className="p-1 img-fluid" src="https://placehold.co/200" alt="" />
                  <img className="p-1 img-fluid" src="https://placehold.co/200" alt="" />
                  <img className="p-1 img-fluid" src="https://placehold.co/200" alt="" />
                </div>
              </div>
              <div className="col-12 col-lg-6 order-lg-2">
                <div className="d-flex flex-column gap-3">
                  <img className="p-2 img-fluid w-100" src="https://placehold.co/450x250" alt="episodio em destaque" />
                  <img className="p-3 img-fluid" src="https://placehold.co/200x150" alt="" />
                  <img className="p-3 img-fluid" src="https://placehold.co/200x150" alt="" />
                </div>
              </div>
            </div>
          </div>
        </section>
    
    </>
  )
}

export default PodcastSection;