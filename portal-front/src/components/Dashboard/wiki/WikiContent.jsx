/**
 * WikiContent.jsx - Visualizador Detalhado de Artigo da Wiki
 *
 * Papel Didático:
 * Renderiza de maneira rica e semântica os blocos didáticos do artigo
 * (parágrafos, alertas do Bootstrap, listas de passos numerados, tabelas e links de ação),
 * sem recorrer a dangerouslySetInnerHTML ou bibliotecas externas.
 */

import { Link } from "react-router";
import { obterCategoriaPorId } from "../../content/wiki/categorias";

export default function WikiContent({
  artigo,
  onVoltar,
  artigosRelacionados = [],
  onSelecionarArtigo,
}) {
  const categoria = obterCategoriaPorId(artigo.categoriaId);

  return (
    <article className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
      {/* Navegação Breadcrumb e Botão Voltar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 pb-3 border-bottom">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-muted"
                onClick={onVoltar}
              >
                <i className="bi bi-house-door me-1"></i>
                Wiki
              </button>
            </li>
            {categoria && (
              <li className="breadcrumb-item text-muted">
                {categoria.nome}
              </li>
            )}
            <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
              {artigo.titulo}
            </li>
          </ol>
        </nav>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm rounded-pill px-3"
          onClick={onVoltar}
        >
          <i className="bi bi-arrow-left me-1"></i>
          Voltar para tópicos
        </button>
      </div>

      {/* Cabeçalho do Artigo */}
      <header className="mb-4">
        {categoria && (
          <div className="mb-2">
            <span className={`badge ${categoria.corBadge || "bg-secondary"} rounded-pill px-3 py-1`}>
              <i className={`bi ${categoria.icone} me-1`}></i>
              {categoria.nome}
            </span>
          </div>
        )}

        <h1 className="h2 fw-bold text-dark mb-3">{artigo.titulo}</h1>

        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small pb-3 border-bottom">
          <span>
            <i className="bi bi-calendar3 me-1"></i>
            Atualizado em: {artigo.atualizadoEm}
          </span>
          <span>•</span>
          <span>
            <i className="bi bi-clock me-1"></i>
            {artigo.tempoLeituraMin} minutos de leitura
          </span>
          {artigo.perfisRecomendados && (
            <>
              <span>•</span>
              <span>
                <i className="bi bi-people me-1"></i>
                Perfis: {artigo.perfisRecomendados.join(", ")}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Corpo Estruturado do Artigo */}
      <div className="wiki-content-body">
        {artigo.secoes?.map((secao, idx) => {
          switch (secao.tipo) {
            case "paragrafo":
              return (
                <p key={idx} className="mb-3">
                  {secao.texto}
                </p>
              );

            case "subtitulo":
              return (
                <h3 key={idx} className="h5 fw-bold text-dark mt-4 mb-3">
                  {secao.texto}
                </h3>
              );

            case "alerta":
              return (
                <div
                  key={idx}
                  className={`alert alert-${secao.variante || "info"} rounded-3 shadow-none my-4`}
                  role="alert"
                >
                  {secao.titulo && (
                    <h5 className="alert-heading h6 fw-bold mb-1">
                      <i className="bi bi-lightbulb-fill me-2"></i>
                      {secao.titulo}
                    </h5>
                  )}
                  <p className="mb-0 small">{secao.texto}</p>
                </div>
              );

            case "passos":
              return (
                <div key={idx} className="d-flex flex-column gap-3 my-4">
                  {secao.itens.map((passo, pIdx) => (
                    <div key={pIdx} className="d-flex align-items-start gap-3">
                      <span className="wiki-step-number">{pIdx + 1}</span>
                      <div className="pt-1">{passo}</div>
                    </div>
                  ))}
                </div>
              );

            case "tabela":
              return (
                <div key={idx} className="table-responsive my-4">
                  <table className="table table-bordered table-hover align-middle small mb-0">
                    <thead className="table-light">
                      <tr>
                        {secao.colunas.map((col, cIdx) => (
                          <th key={cIdx} scope="col">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {secao.linhas.map((linha, lIdx) => (
                        <tr key={lIdx}>
                          {linha.map((celula, celIdx) => (
                            <td key={celIdx}>{celula}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );

            case "acao":
              return (
                <div key={idx} className="my-4 p-3 bg-light rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <span className="fw-semibold text-dark d-block">Deseja praticar no sistema?</span>
                    <span className="text-muted small">Clique no botão ao lado para ir direto para a tela deste recurso.</span>
                  </div>
                  <Link to={secao.rota} className="btn btn-primary rounded-pill px-4">
                    <i className={`bi ${secao.icone || "bi-arrow-right-circle"} me-2`}></i>
                    {secao.texto}
                  </Link>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Artigos Relacionados */}
      {artigosRelacionados.length > 0 && (
        <footer className="mt-5 pt-4 border-top">
          <h4 className="h6 fw-bold text-uppercase text-muted mb-3">Tópicos Relacionados</h4>
          <div className="row g-3">
            {artigosRelacionados.slice(0, 3).map((rel) => (
              <div key={rel.id} className="col-md-4">
                <div
                  className="card p-3 border shadow-none rounded-3 h-100"
                  role="button"
                  onClick={() => onSelecionarArtigo(rel.id)}
                >
                  <span className="fw-bold small text-dark mb-1 text-truncate">{rel.titulo}</span>
                  <span className="text-muted small text-truncate-2">{rel.resumo}</span>
                </div>
              </div>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
