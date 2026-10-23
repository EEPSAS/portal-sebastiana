/**
 * Noticia.jsx - Página Pública de Leitura Completa de uma Notícia (/noticias/:id)
 *
 * Papel Didático:
 * Captura o identificador `:id` da URL via `useParams()`, busca os detalhes no
 * backend através de `useNoticia(id)` e trata os estados Carregando, Erro/Não encontrada e Sucesso.
 */
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import NoticiaHeader from "../../components/Portal/noticia/NoticiaHeader";
import NoticiaContent from "../../components/Portal/noticia/NoticiaContent";
import { useNoticia } from "../../hooks/useNoticias";
// Import em camelCase alinhado ao nome real do arquivo no Git para compatibilidade Linux
import "../../components/Portal/noticia/noticiaDetail.css";

const Noticia = () => {
  const { id } = useParams();
  const { noticia, loading, error } = useNoticia(id);

  // Garante que a abertura da notícia sempre posicione o leitor no topo da página
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [id]);

  return (
    <section className="noticia-detail">
      <div className="container">
        <Link to="/" className="noticia-detail__back">
          <i className="bi bi-arrow-left" aria-hidden="true" /> Voltar para o portal
        </Link>

        {/* Estado 1: Carregando */}
        {loading && (
          <div className="noticia-detail__state" role="status">
            <div className="spinner-border text-primary" />
            <span className="visually-hidden">Carregando...</span>
          </div>
        )}

        {/* Estado 2: Erro Amigável ou Registro Vazio/Inexistente */}
        {!loading && (error || !noticia) && (
          <div className="noticia-detail__state">
            <h2>Notícia não encontrada</h2>
            <p>Não foi possível carregar esta notícia.</p>
          </div>
        )}

        {/* Estado 3: Exibição da Matéria */}
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

