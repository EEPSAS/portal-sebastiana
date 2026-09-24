import { useState } from 'react';
import HorizontalNewsCard from '../HorizontalNewsCard';
import SmallNewsCard from '../SmallNewsCard';
import VerticalNewsCard from '../VerticalNewsCard';
import { useNoticias } from '../../../hooks/useNoticias';
import './noticias.css';

const categorias = [
  { nome: 'Destaque', classe: 'category-control--featured' },
  { nome: 'Eventos', classe: 'category-control--small' },
  { nome: 'Outros', classe: 'category-control--vertical' },
];

const NoticiasSection = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const { noticias: noticiasApi, loading, error } = useNoticias();

  const noticiaDestaque = noticiasApi.find((noticia) => noticia.destaque) || noticiasApi[0];
  const noticiasRestantes = noticiasApi.filter((noticia) => noticia.id !== noticiaDestaque?.id);
  const noticias = {
    destaque: noticiaDestaque,
    vertical: noticiasRestantes[3],
    pequenas: noticiasRestantes.slice(0, 3),
  };

  if (loading) {
    return <section id="Noticias" className="noticias-section"><div className="container"><p>Carregando notícias...</p></div></section>;
  }

  if (error) {
    return <section id="Noticias" className="noticias-section"><div className="container"><p role="alert">Não foi possível carregar as notícias.</p></div></section>;
  }

  if (!noticiaDestaque) {
    return <section id="Noticias" className="noticias-section"><div className="container"><p>Nenhuma notícia disponível.</p></div></section>;
  }

  return (
    <section id="Noticias" className="noticias-section">
      <div className="container">
        <h1 className="noticias-title">Notícias EEPSAS</h1>
        <h2 className="noticias-subtitle">O que anda acontecendo por aqui?</h2>

        <div className="category-nav" aria-label="Filtrar notícias por categoria">
          {categorias.map((categoria) => (
            <button
              key={categoria.nome}
              type="button"
              className={`category-control ${categoria.classe} ${categoriaAtiva === categoria.classe ? 'is-active' : ''}`}
              aria-pressed={categoriaAtiva === categoria.classe}
              onClick={() => setCategoriaAtiva((categoriaAtual) => (
                categoriaAtual === categoria.classe ? null : categoria.classe
              ))}
            >
              {categoria.nome}
            </button>
          ))}
        </div>

        <div className="news-layout row g-3 align-items-start">
          <div className="col-12 col-lg-9">
            <div className="news-group news-group--featured">
              <HorizontalNewsCard noticia={noticias.destaque} />
            </div>
            <div className="news-group news-group--small-grid row g-3 mt-0">
              {noticias.pequenas.map((noticia) => (
                <div className="col-12 col-sm-6 col-lg-4" key={noticia.id}>
                  <SmallNewsCard noticia={noticia} />
                </div>
              ))}
            </div>
          </div>

          <div className="news-group news-group--vertical col-12 col-lg-3">
            {noticias.vertical && <VerticalNewsCard noticia={noticias.vertical} />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoticiasSection;