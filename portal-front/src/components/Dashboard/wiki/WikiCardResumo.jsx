/**
 * WikiCardResumo.jsx - Card de Apresentação de Artigo na Listagem da Wiki
 *
 * Papel Didático:
 * Renderiza um resumo objetivo do artigo, destacando tags, tempo de leitura
 * e sinalizando se é um tópico prioritário para a role atual do usuário.
 */

import { obterCategoriaPorId } from "../../content/wiki/categorias";

export default function WikiCardResumo({ artigo, onAbrirArtigo, roleUsuario = "aluno" }) {
  const categoria = obterCategoriaPorId(artigo.categoriaId);
  const roleNormalizada = roleUsuario?.toLowerCase();
  const isPrioritario =
    artigo.perfisRecomendados.includes(roleNormalizada) && roleNormalizada !== "aluno";

  return (
    <div
      className={`card wiki-article-card h-100 shadow-sm p-4 ${
        isPrioritario ? "border-primary" : ""
      }`}
      onClick={() => onAbrirArtigo(artigo.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrirArtigo(artigo.id);
        }
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        {categoria && (
          <span className={`badge ${categoria.corBadge || "bg-secondary"} rounded-pill px-3 py-1`}>
            <i className={`bi ${categoria.icone} me-1`}></i>
            {categoria.nome}
          </span>
        )}
        <span className="text-muted small">
          <i className="bi bi-clock me-1"></i>
          {artigo.tempoLeituraMin} min de leitura
        </span>
      </div>

      <h5 className="fw-bold text-dark mt-2 mb-2">{artigo.titulo}</h5>
      <p className="text-muted small flex-grow-1 mb-3">{artigo.resumo}</p>

      {/* Destaque se for prioritário para o perfil */}
      {isPrioritario && (
        <div className="badge bg-primary-subtle text-primary border border-primary-subtle mb-3 align-self-start">
          <i className="bi bi-star-fill me-1"></i>
          Recomendado para seu perfil
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between pt-2 border-top">
        <div className="d-flex gap-1 flex-wrap">
          {artigo.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="badge bg-light text-muted border small">
              #{tag}
            </span>
          ))}
        </div>
        <span className="text-primary fw-semibold small d-inline-flex align-items-center gap-1">
          Ler tópico <i className="bi bi-arrow-right"></i>
        </span>
      </div>
    </div>
  );
}
