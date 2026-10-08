import { Link, useParams } from "react-router";
import NoticiaHeader from "../../components/Portal/noticia/NoticiaHeader";
import NoticiaContent from "../../components/Portal/noticia/NoticiaContent";
import { useNoticia } from "../../hooks/useNoticias";
import "../../components/Portal/noticia/noticiaDetail.css";

const Noticia = () => {
  const { id } = useParams();
  const { noticia, loading, error } = useNoticia(id);

  return (
    <section className="noticia-detail">
      <div className="container">
        <Link to="/" className="noticia-detail__back">
          <i className="bi bi-arrow-left" aria-hidden="true" /> Voltar para o portal
        </Link>

        {loading && (
          <div className="noticia-detail__state" role="status">
            <div className="spinner-border text-primary" />
            <span className="visually-hidden">Carregando...</span>
          </div>
        )}

        {!loading && (error || !noticia) && (
          <div className="noticia-detail__state">
            <h2>Notícia não encontrada</h2>
            <p>Não foi possível carregar esta notícia.</p>
          </div>
        )}

        {!loading && !error && noticia && (
          <>
            <NoticiaHeader noticia={noticia} />
            <NoticiaContent noticia={noticia} />
          </>
        )}
      </div>
    </section>
  );
};

export default Noticia;
