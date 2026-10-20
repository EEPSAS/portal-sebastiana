/**
 * NoticiaContent.jsx - Corpo da Matéria na Leitura Individual de Notícia
 *
 * Papel Didático:
 * Renderiza a imagem principal de capa e o texto integral da notícia publicada.
 */
const NoticiaContent = ({ noticia }) => {
  const capaUrl = noticia.url_foto || noticia.imagem;
  const miniaturaUrl = noticia.url_miniatura || noticia.miniatura;

  return (
    <article className="noticia-detail__content">
      {capaUrl && <img src={capaUrl} alt={noticia.titulo || ''} />}
      <p>{noticia.conteudo}</p>
      {miniaturaUrl && miniaturaUrl !== capaUrl && (
        <img className="noticia-detail__thumbnail" src={miniaturaUrl} alt="" />
      )}
    </article>
  );
};

export default NoticiaContent;

