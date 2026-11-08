/**
 * WikiContainer.jsx - Orquestrador Central da Interface da Wiki
 *
 * Papel Didático:
 * Gerencia o estado reativo da base de conhecimento (termo de pesquisa,
 * categoria ativa e artigo aberto), tratando com clareza os 3 estados assíncronos
 * e a ordenação prioritária por perfil (Role-Based Relevance).
 */

import { useState, useMemo } from "react";
import WikiSearchBar from "./WikiSearchBar";
import WikiSidebar from "./WikiSidebar";
import WikiCardResumo from "./WikiCardResumo";
import WikiContent from "./WikiContent";
import {
  CATEGORIAS_WIKI,
  listarTodosArtigos,
  obterArtigoPorId,
  buscarArtigos,
} from "../../content/wiki";
import "./wiki.css";

export default function WikiContainer({ roleUsuario = "aluno", modoPublico = false }) {
  const [termoBusca, setTermoBusca] = useState("");
  const [categoriaAtivaId, setCategoriaAtivaId] = useState(null);
  const [artigoAtivoId, setArtigoAtivoId] = useState(null);

  // Lista todos os artigos da base
  const todosArtigos = useMemo(() => listarTodosArtigos(), []);

  // Mapeia contagem de artigos por categoria
  const contagemPorCategoria = useMemo(() => {
    const mapa = {};
    todosArtigos.forEach((artigo) => {
      mapa[artigo.categoriaId] = (mapa[artigo.categoriaId] || 0) + 1;
    });
    return mapa;
  }, [todosArtigos]);

  // Artigos filtrados conforme termo e categoria
  const artigosFiltrados = useMemo(() => {
    return buscarArtigos({
      termo: termoBusca,
      categoriaId: categoriaAtivaId,
      role: roleUsuario,
    });
  }, [termoBusca, categoriaAtivaId, roleUsuario]);

  // Artigo ativo completo
  const artigoAtivo = useMemo(() => {
    if (!artigoAtivoId) return null;
    return obterArtigoPorId(artigoAtivoId);
  }, [artigoAtivoId]);

  // Artigos relacionados da mesma categoria
  const artigosRelacionados = useMemo(() => {
    if (!artigoAtivo) return [];
    return todosArtigos.filter(
      (a) => a.categoriaId === artigoAtivo.categoriaId && a.id !== artigoAtivo.id
    );
  }, [artigoAtivo, todosArtigos]);

  const handleSelecionarArtigo = (id) => {
    setArtigoAtivoId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVoltar = () => {
    setArtigoAtivoId(null);
  };

  const handleLimparBusca = () => {
    setTermoBusca("");
  };

  return (
    <div className="wiki-wrapper py-3">
      {/* 1. Barra de Busca e Título */}
      <WikiSearchBar
        termoBusca={termoBusca}
        onTermoChange={setTermoBusca}
        totalResultados={artigosFiltrados.length}
        onLimpar={handleLimparBusca}
      />

      {/* 2. Visualização de Artigo Aberto OU Navegação de Tópicos */}
      {artigoAtivo ? (
        <WikiContent
          artigo={artigoAtivo}
          onVoltar={handleVoltar}
          artigosRelacionados={artigosRelacionados}
          onSelecionarArtigo={handleSelecionarArtigo}
        />
      ) : (
        <div className="row g-4">
          {/* Menu Lateral de Categorias */}
          <div className="col-lg-4 col-xl-3">
            <WikiSidebar
              categorias={CATEGORIAS_WIKI}
              categoriaAtivaId={categoriaAtivaId}
              onSelecionarCategoria={(catId) => {
                setCategoriaAtivaId(catId);
                setArtigoAtivoId(null);
              }}
              totalArtigos={todosArtigos.length}
              contagemPorCategoria={contagemPorCategoria}
            />

            {modoPublico && (
              <div className="card border-0 bg-primary-subtle rounded-4 p-3 text-center">
                <i className="bi bi-person-badge fs-2 text-primary mb-2"></i>
                <h6 className="fw-bold mb-1">Acesso ao Painel</h6>
                <p className="small text-muted mb-3">
                  É membro da escola? Acesse com seu login institucional para ver suas notas ou diários.
                </p>
                <a href="/login" className="btn btn-primary btn-sm rounded-pill">
                  Entrar no Sistema
                </a>
              </div>
            )}
          </div>

          {/* Listagem de Artigos */}
          <div className="col-lg-8 col-xl-9">
            {/* Estado Vazio */}
            {artigosFiltrados.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                <i className="bi bi-search fs-1 text-muted opacity-50 mb-3"></i>
                <h5 className="fw-bold text-dark">Nenhum tópico encontrado</h5>
                <p className="text-muted small mb-4">
                  Não encontramos nenhum manual com os termos digitados. Tente buscar por palavras como &quot;boletim&quot;, &quot;livro&quot;, &quot;horário&quot; ou limpe a pesquisa.
                </p>
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm rounded-pill px-4"
                    onClick={handleLimparBusca}
                  >
                    Limpar filtro de busca
                  </button>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {artigosFiltrados.map((artigo) => (
                  <div key={artigo.id} className="col-md-6">
                    <WikiCardResumo
                      artigo={artigo}
                      onAbrirArtigo={handleSelecionarArtigo}
                      roleUsuario={roleUsuario}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
