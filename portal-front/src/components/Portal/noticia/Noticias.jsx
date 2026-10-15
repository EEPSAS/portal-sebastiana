import { useState } from 'react';
import HorizontalNewsCard from './HorizontalNewsCard';
import SmallNewsCard from './SmallNewsCard';
import VerticalNewsCard from './VerticalNewsCard';
import { useNoticias } from '../../../hooks/useNoticias';
import { DEFAULT_NOTICIAS } from './noticiasMock';
import './noticias.css';

const categorias = [
  { nome: 'Destaque', classe: 'category-control--featured' },
  { nome: 'Eventos', classe: 'category-control--small' },
  { nome: 'Outros', classe: 'category-control--vertical' },
];

const NoticiasSection = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const { noticias: noticiasApi, loading } = useNoticias();

  // Se houver notícias da API, usa elas; caso contrário, se ainda estiver carregando, exibe o esqueleto com os mocks
  const list = (!loading && noticiasApi)
    ? noticiasApi
    : DEFAULT_NOTICIAS;

  // 1. Identifica a notícia de destaque (ou a primeira da lista)
  const noticiaDestaque = list.length > 0 ? (list.find((n) => n.destaque) || list[0]) : null;

  // 2. Filtra as demais notícias para compor a grade pequena e o card vertical sem repetição
  const noticiasRestantes = list.filter((n) => n.id !== noticiaDestaque?.id);

  // 3. Monta a estrutura garantindo 3 posições pequenas e 1 vertical (preenchendo com null se não houver no BD)
  const noticias = {
    destaque: noticiaDestaque,
    pequenas: [
      noticiasRestantes[0] || null,
      noticiasRestantes[1] || null,
      noticiasRestantes[2] || null,
    ],
    vertical: noticiasRestantes[3] || null,
  };

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

        <div className="news-layout row g-3">
          <div className="col-12 col-lg-9 d-flex flex-column">
            <div className="news-group news-group--featured">
              <HorizontalNewsCard noticia={noticias.destaque} loading={loading} />
            </div>
            <div className="news-group news-group--small-grid row g-3 mt-0 flex-grow-1">
              {noticias.pequenas.map((noticia, idx) => (
                <div className="col-12 col-sm-6 col-lg-4" key={noticia?.id || `small-slot-${idx}`}>
                  <SmallNewsCard noticia={noticia} loading={loading} />
                </div>
              ))}
            </div>
          </div>

          <div className="news-group news-group--vertical col-12 col-lg-3 d-flex flex-column">
            <VerticalNewsCard noticia={noticias.vertical} loading={loading} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoticiasSection;