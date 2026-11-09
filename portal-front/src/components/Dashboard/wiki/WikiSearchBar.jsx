/**
 * WikiSearchBar.jsx - Campo de Busca em Tempo Real da Wiki
 *
 * Papel Didático:
 * Componente controlado de busca rápida que filtra artigos e manuais
 * por termos, títulos, tags ou conteúdos sem necessitar de requisições ao servidor.
 */

export default function WikiSearchBar({ termoBusca, onTermoChange, totalResultados, onLimpar }) {
  return (
    <div className="wiki-search-container text-center mb-4">
      <h1 className="h3 fw-bold mb-2">Wiki & Manuais do Portal Sebastiana</h1>
      <p className="text-light opacity-75 mb-4">
        Tire dúvidas, aprenda a usar os módulos e consulte guias passo a passo da escola.
      </p>

      <div className="wiki-search-input-group">
        <i className="bi bi-search wiki-search-icon" aria-hidden="true"></i>
        <input
          type="text"
          className="form-control wiki-search-input"
          placeholder="Ex: Como ver notas, importar CSV, reservar livro, horários..."
          value={termoBusca}
          onChange={(e) => onTermoChange(e.target.value)}
          aria-label="Pesquisar manuais e tópicos na Wiki"
        />
        {termoBusca && (
          <button
            type="button"
            className="wiki-search-clear-btn"
            onClick={onLimpar}
            title="Limpar pesquisa"
            aria-label="Limpar pesquisa"
          >
            <i className="bi bi-x-circle-fill fs-5"></i>
          </button>
        )}
      </div>

      {termoBusca && (
        <div className="mt-3 text-white-50 small">
          <i className="bi bi-info-circle me-1"></i>
          {totalResultados === 1
            ? "1 tópico encontrado"
            : `${totalResultados} tópicos encontrados para "${termoBusca}"`}
        </div>
      )}
    </div>
  );
}
