const Categorias = ({ categories, activeCategories, onToggleCategory, onClearCategories }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Categorias</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {categories.map((category) => {
        const isActive = activeCategories.has(category.key);
        return (
          <label key={category.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', opacity: isActive ? 1 : 0.55 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '6px', background: category.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>{category.icon}</span>
              <span>
                <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>{category.label}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{category.description}</span>
              </span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => onToggleCategory(category.key)}
              aria-label={`Mostrar ${category.label}`}
              style={{ accentColor: category.color, width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </label>
        );
      })}
    </div>
    <button type="button" onClick={onClearCategories} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#e6007e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
      🧹 Limpar filtros
    </button>
  </div>
);

export default Categorias;