/**
 * Categorias.jsx - Painel de Filtros por Categoria de Evento
 *
 * Papel Didático:
 * Permite ao usuário filtrar eventos escolares por categorias (pedagógico, acadêmico, feriado, etc).
 * Os estilos visuais foram extraídos para `Agenda.css`, mantendo estilos inline
 * unicamente para propriedades dinâmicas de cor definidas na configuração (`category.color`).
 */

const Categorias = ({ categories, activeCategories, onToggleCategory, onClearCategories }) => (
  <div className="agenda-categories-container">
    <h3 className="agenda-categories-title">Categorias</h3>
    <div className="agenda-categories-list">
      {categories.map((category) => {
        const isActive = activeCategories.has(category.key);
        return (
          <label
            key={category.key}
            className={`agenda-category-item ${isActive ? '' : 'is-inactive'}`}
          >
            <span className="agenda-category-info">
              <span
                className="agenda-category-icon"
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </span>
              <span className="agenda-category-text">
                <strong className="agenda-category-name">{category.label}</strong>
                <span className="agenda-category-desc">{category.description}</span>
              </span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => onToggleCategory(category.key)}
              aria-label={`Mostrar ${category.label}`}
              className="agenda-category-checkbox"
              style={{ accentColor: category.color }}
            />
          </label>
        );
      })}
    </div>
    <button
      type="button"
      onClick={onClearCategories}
      className="agenda-clear-filters-btn"
    >
      🧹 Limpar filtros
    </button>
  </div>
);

export default Categorias;