import { Link, useParams } from 'react-router';
import NoticiaContent from '../../../components/Portal/noticia/NoticiaContent';
import NoticiaHeader from '../../../components/Portal/noticia/NoticiaHeader';
import { useNoticia } from '../../../hooks/useNoticias';
import './noticia.css';

const NoticiaPage = () => {
  const { id } = useParams();
  const { noticia, loading, error } = useNoticia(id);

  if (loading) {
    return <section className="noticia-detail"><div className="container"><p>Carregando notícia...</p></div></section>;
  }

  if (error || !noticia) {
    return (
      <section className="noticia-detail noticia-detail--not-found">
        <div className="container">
          <h1>Notícia não encontrada</h1>
          <p>Não conseguimos localizar a notícia solicitada.</p>
          <Link to="/">Voltar para o início</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="noticia-detail">
      <div className="container">
        <Link className="noticia-detail__back" to="/">
          Voltar para notícias
        </Link>
        <div className="noticia-detail__paper">
          <NoticiaHeader noticia={noticia} />
          <NoticiaContent noticia={noticia} />
        </div>
      </div>
    </section>
  );
};

export default NoticiaPage;
