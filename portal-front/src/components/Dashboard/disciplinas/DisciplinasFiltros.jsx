/**
 * DisciplinasFiltros.jsx - Barra de Pesquisa e Filtros de Disciplinas (Módulo 5.5)
 *
 * Papel Didático:
 * Permite filtrar o catálogo escolar:
 * - Busca textual por nome, habilidades BNCC ou ementa;
 * - Seletor de Ciclos curriculares;
 * - Indicador da quantidade de disciplinas filtradas em relação ao total.
 */

export default function DisciplinasFiltros({
  busca,
  filtroCiclo,
  ciclos,
  totalFiltradas,
  totalGeral,
  onBuscaChange,
  onLimparBusca,
  onFiltroCicloChange,
}) {
  return (
    <div className="card border bg-light rounded-3 p-2 mb-2 flex-shrink-0">
      <div className="row g-2 align-items-center">
        {/* Campo de Busca Textual */}
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Pesquisar por disciplina, BNCC ou ementa..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
            />
            {busca && (
              <button
                type="button"
                className="btn btn-outline-secondary bg-white border-start-0"
                onClick={onLimparBusca}
                title="Limpar pesquisa"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* Seletor de Ciclos */}
        <div className="col-12 col-md-6 col-lg-4">
          <select
            className="form-select form-select-sm"
            value={filtroCiclo}
            onChange={(e) => onFiltroCicloChange(e.target.value)}
          >
            <option value="">Todos os Ciclos</option>
            {ciclos.map((c) => (
              <option key={c.id_ciclo} value={c.id_ciclo}>
                Filtrar por: {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Contador Informativo */}
        <div className="col-12 col-lg-3 text-lg-end text-muted small">
          <strong>{totalFiltradas}</strong> de{" "}
          <strong>{totalGeral}</strong> disciplina(s)
        </div>
      </div>
    </div>
  );
}
