/**
 * NoticiaContent.jsx - Corpo da Matéria na Leitura Individual de Notícia
 *
 * Papel Didático:
 * Renderiza a imagem principal de capa e o texto integral da notícia publicada.
 */
const NoticiaContent = ({ noticia }) => {
  // A Capa é a imagem de destaque no topo da página interna; se não houver capa, usa a miniatura como fallback
  const imagemCapa = noticia.url_foto || noticia.imagem || noticia.url_miniatura || noticia.miniatura;

  return (
    <article className="noticia-detail__content">
      {/* Imagem de Capa em destaque no topo da notícia */}
      {imagemCapa && <img src={imagemCapa} alt={noticia.titulo || ''} />}
      <p>{noticia.conteudo}</p>
    </article>
  );
};

export default NoticiaContent;

