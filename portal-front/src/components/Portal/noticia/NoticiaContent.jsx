/**
 * NoticiaContent.jsx - Corpo da Matéria na Leitura Individual de Notícia
 *
 * Papel Didático:
 * Renderiza a imagem principal de capa e o texto integral da notícia publicada.
 */
const NoticiaContent = ({ noticia }) => (
  <article className="noticia-detail__content">
    <img src={noticia.imagem} alt={noticia.titulo || ''} />
    <p>{noticia.conteudo}</p>
    <img className="noticia-detail__thumbnail" src={noticia.miniatura} alt="" />
  </article>
);

export default NoticiaContent;

