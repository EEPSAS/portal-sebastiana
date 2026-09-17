const categorias = ['Alunos destaques', 'Inovações', 'Eventos', 'Conquistas'];

const noticias = {
  destaque: {
    titulo: 'Alunos destaques do trimestre',
    descricao: 'Confira os alunos que receberam destaque por seu comportamento e compromisso.',
    imagem: 'https://placehold.co/900x420',
  },
  vertical: {
    titulo: 'Eventos da escola',
    descricao: 'Veja os principais eventos e momentos vividos pela nossa comunidade escolar.',
    imagem: 'https://placehold.co/500x650',
  },
  pequenas: [
    { titulo: 'Trote do terceirão', imagem: 'https://placehold.co/360x180' },
    { titulo: 'Conscientizações educacionais', imagem: 'https://placehold.co/360x180' },
    { titulo: 'Louva Jaguaraçu 2026', imagem: 'https://placehold.co/360x180' },
  ],
};

const HorizontalNewsCard = ({ noticia }) => (
  <article className="h-100 rounded-4 bg-white p-3 shadow-sm">
    <div className="row h-100 align-items-center g-3">
      <div className="col-12 col-md-7">
        <img className="img-fluid w-100 rounded-3" src={noticia.imagem} alt="" />
      </div>
      <div className="col-12 col-md-5">
        <h3 className="h2 text-secondary">{noticia.titulo}</h3>
        <p className="mb-0">{noticia.descricao}</p>
      </div>
    </div>
  </article>
);

const VerticalNewsCard = ({ noticia }) => (
  <article className="h-100 rounded-4 bg-white p-3 shadow-sm">
    <img className="img-fluid w-100 rounded-3" src={noticia.imagem} alt="" />
    <h3 className="h4 text-secondary mt-3">{noticia.titulo}</h3>
    <p className="mb-0">{noticia.descricao}</p>
  </article>
);

const SmallNewsCard = ({ noticia }) => (
  <article className="h-100 rounded-4 bg-white p-3 shadow-sm">
    <img className="img-fluid w-100 rounded-3" src={noticia.imagem} alt="" />
    <h3 className="h5 text-secondary mt-3 mb-0">{noticia.titulo}</h3>
  </article>
);

const NoticiasSection = () => {
  return (
    <section id="Noticias" className="bg-light py-5">
      <div className="container">
        <h1 className="text-secondary mb-1">Notícias EEPSAS</h1>
        <h2 className="h4 text-secondary mb-4">O que anda acontecendo por aqui?</h2>

        <div className="d-flex flex-wrap justify-content-center gap-3 mb-3">
          {categorias.map((categoria) => (
            <span key={categoria} className="rounded-3 bg-secondary px-3 py-2 text-light">
              {categoria}
            </span>
          ))}
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-9">
            <HorizontalNewsCard noticia={noticias.destaque} />
            <div className="row g-3 mt-0">
              {noticias.pequenas.map((noticia) => (
                <div className="col-12 col-sm-6 col-lg-4" key={noticia.titulo}>
                  <SmallNewsCard noticia={noticia} />
                </div>
              ))}
            </div>
          </div>

          <div className="col-12 col-lg-3">
            <VerticalNewsCard noticia={noticias.vertical} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoticiasSection;