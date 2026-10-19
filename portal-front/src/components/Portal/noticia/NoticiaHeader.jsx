/**
 * NoticiaHeader.jsx - Cabeçalho Editorial da Página de Leitura de Notícia
 *
 * Papel Didático:
 * Apresenta categoria, título principal, linha-fina (descrição) e metadados de autoria/data.
 */
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

