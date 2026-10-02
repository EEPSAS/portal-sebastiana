const ProximosEventos = ({
  listedEvents,
  showAllEvents,
  selectedDate,
  getCategory,
  onToggleShowAll,
  onSelectEvent,
}) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Próximos eventos</h3>
      <button type="button" onClick={onToggleShowAll} style={{ border: 0, background: 'transparent', fontSize: '12px', color: '#e6007e', cursor: 'pointer', fontWeight: '600' }}>
        {showAllEvents ? 'Ver menos' : 'Ver todos'}
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {listedEvents.length > 0 ? listedEvents.map((event) => {
        const category = getCategory(event.category);
        const isSelected = selectedDate === event.date;
        return (
          <button type="button" key={event.id} onClick={() => onSelectEvent(event)} aria-pressed={isSelected} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', border: isSelected ? `2px solid ${category.color}` : '1px solid #e2e8f0', borderRadius: '14px', background: '#fff', padding: '8px', cursor: 'pointer' }}>
            <span style={{ width: '32px', height: '32px', borderRadius: '6px', background: category.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '14px', flexShrink: 0 }}>{category.icon}</span>
            <span>
              <strong style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{event.title}</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{category.eventLabel} • {new Intl.DateTimeFormat('pt-BR').format(new Date(`${event.date}T00:00:00`))}</span>
            </span>
          </button>
        );
      }) : <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Nenhum evento corresponde aos filtros.</p>}
    </div>
  </div>
);

export default ProximosEventos;