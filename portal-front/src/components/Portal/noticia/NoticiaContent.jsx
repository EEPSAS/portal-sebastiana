const NoticiaContent = ({ noticia }) => (
  <article className="noticia-detail__content">
    <img src={noticia.imagem} alt="" />
    <p>{noticia.conteudo}</p>
    <img className="noticia-detail__thumbnail" src={noticia.miniatura} alt="" />
  </article>
);

export default NoticiaContent;
