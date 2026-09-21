const NoticiaHeader = ({ noticia }) => (
  <header className="noticia-detail__header">
    <span className="noticia-detail__category">{noticia.categoria}</span>
    <h1>{noticia.titulo}</h1>
    <p>{noticia.descricao}</p>
    <div className="noticia-detail__meta">
      <span>{noticia.autor}</span>
      <span>{noticia.dataPublicacao}</span>
    </div>
  </header>
);

export default NoticiaHeader;
