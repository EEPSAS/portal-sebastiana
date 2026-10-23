/**
 * Noticias.jsx - Seção Pública de Notícias da Home do Portal
 *
 * Papel Didático:
 * Consome as últimas matérias escolares via `useNoticias()` (GET /api/noticias)
 * e distribui os itens em 3 formatos visuais (Destaque Horizontal, 3 Cards Pequenos e 1 Card Vertical),
 * respeitando os 3 estados assíncronos obrigatórios: Carregando, Erro Amigável e Vazio.
 */
import { useState } from 'react';
import HorizontalNewsCard from './HorizontalNewsCard';
import SmallNewsCard from './SmallNewsCard';
import VerticalNewsCard from './VerticalNewsCard';
import { useNoticias } from '../../../hooks/useNoticias';
import './noticias.css';

const categorias = [
  { nome: 'Destaque', classe: 'category-control--featured' },
  { nome: 'Eventos', classe: 'category-control--small' },
  { nome: 'Outros', classe: 'category-control--vertical' },
];

const NoticiasSection = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  // Consome os 3 estados do hook de notícias (dados reais da API, carregamento e erro)
  const { noticias: noticiasApi, loading, error } = useNoticias();

  const listaSegura = Array.isArray(noticiasApi) ? noticiasApi : [];

  // 1. Identifica a notícia marcada como destaque (ou a primeira da lista caso nenhuma esteja marcada)
  const noticiaDestaque =
    listaSegura.length > 0 ? listaSegura.find((n) => n.destaque) || listaSegura[0] : null;

  // 2. Filtra as demais notícias para compor a grade pequena e o card vertical sem duplicar o destaque
  const noticiasRestantes = listaSegura.filter((n) => n.id !== noticiaDestaque?.id);

  // 3. Organiza os slots do layout (preenchendo com null quando houver menos de 5 notícias no banco)
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

        {/* Botões de realce visual por grupo de categoria */}
        <div className="category-nav" aria-label="Filtrar notícias por categoria">
          {categorias.map((categoria) => (
            <button
              key={categoria.nome}
              type="button"
              className={`category-control ${categoria.classe} ${categoriaAtiva === categoria.classe ? 'is-active' : ''}`}
              aria-pressed={categoriaAtiva === categoria.classe}
              onClick={() =>
                setCategoriaAtiva((categoriaAtual) =>
                  categoriaAtual === categoria.classe ? null : categoria.classe
                )
              }
            >
              {categoria.nome}
            </button>
          ))}
        </div>

        {/* Estado de Erro Amigável caso a API não responda */}
        {!loading && error && (
          <div className="alert alert-warning rounded-4 shadow-sm text-center py-4 my-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Não foi possível carregar as notícias no momento. Tente novamente mais tarde.
          </div>
        )}

        {/* Grade de Notícias (exibe skeletons durante loading e cards vazios se não houver registros) */}
        {!error && (
          <div className="news-layout row g-3">
            <div className="col-12 col-lg-9 d-flex flex-column">
              <div className="news-group news-group--featured">
                <HorizontalNewsCard
                  noticia={noticias.destaque}
                  loading={loading}
                />
              </div>
              <div className="news-group news-group--small-grid row g-3 mt-0 flex-grow-1">
                {noticias.pequenas.map((noticia, idx) => (
                  <div className="col-12 col-sm-6 col-lg-4" key={noticia?.id || `small-slot-${idx}`}>
                    <SmallNewsCard
                      noticia={noticia}
                      loading={loading}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="news-group news-group--vertical col-12 col-lg-3 d-flex flex-column">
              <VerticalNewsCard
                noticia={noticias.vertical}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NoticiasSection;