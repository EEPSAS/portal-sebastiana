const NoticiaContent = ({ noticia }) => (
  <article className="noticia-detail__content">
    <img src={noticia.imagem} alt="" />
    <p>{noticia.conteudo}</p>
  </article>
);

export default NoticiaContent;
