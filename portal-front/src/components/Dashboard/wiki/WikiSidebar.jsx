/**
 * WikiSidebar.jsx - Menu Lateral de Categorias e Tópicos da Wiki
 *
 * Papel Didático:
 * Permite ao usuário filtrar a base de conhecimento pelos eixos temáticos
 * que espelham a arquitetura de módulos do sistema.
 */

export default function WikiSidebar({
  categorias,
  categoriaAtivaId,
  onSelecionarCategoria,
  totalArtigos,
  contagemPorCategoria = {},
}) {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3 px-2">
        <h6 className="fw-bold text-uppercase text-muted small mb-0">Eixos Temáticos</h6>
        <span className="badge bg-light text-dark border">{totalArtigos} tópicos</span>
      </div>

      <nav className="d-flex flex-column gap-1" aria-label="Navegação por categorias da Wiki">
        {/* Opção para listar todos */}
        <button
          type="button"
          className={`wiki-sidebar-item ${categoriaAtivaId === null ? "active" : ""}`}
          onClick={() => onSelecionarCategoria(null)}
        >
          <div className="d-flex align-items-center text-truncate">
            <i className="bi bi-grid-fill me-2 fs-6"></i>
            <span className="text-truncate">Todos os Tópicos</span>
          </div>
          <span className={`badge rounded-pill ${categoriaAtivaId === null ? "bg-light text-dark" : "bg-secondary"}`}>
            {totalArtigos}
          </span>
        </button>

        <hr className="my-2 opacity-25" />

        {categorias.map((cat) => {
          const ativa = categoriaAtivaId === cat.id;
          const qtd = contagemPorCategoria[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              className={`wiki-sidebar-item ${ativa ? "active" : ""}`}
              onClick={() => onSelecionarCategoria(cat.id)}
            >
              <div className="d-flex align-items-center text-truncate">
                <i className={`bi ${cat.icone} me-2 fs-6`}></i>
                <span className="text-truncate">{cat.nome}</span>
              </div>
              <span className={`badge rounded-pill ${ativa ? "bg-light text-dark" : "bg-light text-muted border"}`}>
                {qtd}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
