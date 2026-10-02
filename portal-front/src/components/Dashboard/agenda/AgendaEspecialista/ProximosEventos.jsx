import BotaoNovoEvento from './BotaoNovoEvento';

const ProximosEventos = ({
  listedEvents,
  showAllEvents,
  selectedDate,
  getCategory,
  onToggleShowAll,
  onSelectEvent,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  canManageEvents,
  loading,
  eventsError,
  mutationError,
  saving,
}) => (
  <div className="agenda-especialista-events">
    <div className="agenda-especialista-events-header">
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Próximos eventos</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button type="button" onClick={onToggleShowAll} style={{ border: 0, background: 'transparent', fontSize: '12px', color: '#e6007e', cursor: 'pointer', fontWeight: '600' }}>
          {showAllEvents ? 'Ver menos' : 'Ver todos'}
        </button>
        {canManageEvents && <BotaoNovoEvento onClick={onAddEvent} disabled={saving} />}
      </div>
    </div>
    <div className="agenda-especialista-event-list">
      {(eventsError || mutationError) && <p role="alert" style={{ margin: 0, color: '#be123c', fontSize: '12px' }}>{eventsError || mutationError}</p>}
      {loading ? <p role="status" style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Carregando eventos...</p> : listedEvents.length > 0 ? listedEvents.map((event) => {
        const category = getCategory(event.category);
        const isSelected = selectedDate === event.date;
        return (
          <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', border: isSelected ? `2px solid ${category.color}` : '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', padding: '6px' }}>
            <button type="button" onClick={() => onSelectEvent(event)} aria-pressed={isSelected} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', padding: '2px', cursor: 'pointer' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '6px', background: category.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '14px', flexShrink: 0 }}>{category.icon}</span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{event.title}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{category.eventLabel} • {new Intl.DateTimeFormat('pt-BR').format(new Date(`${event.date}T00:00:00`))}</span>
              </span>
            </button>
            {canManageEvents && (
              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                <button type="button" onClick={() => onEditEvent(event)} disabled={saving} aria-label={`Editar ${event.title}`} title="Editar" style={{ border: 0, borderRadius: '6px', background: '#f1f5f9', color: '#475569', padding: '6px', cursor: saving ? 'wait' : 'pointer', fontSize: '11px' }}>
                  Editar
                </button>
                <button type="button" onClick={() => onDeleteEvent(event)} disabled={saving} aria-label={`Excluir ${event.title}`} title="Excluir" style={{ border: 0, borderRadius: '6px', background: '#fff1f2', color: '#be123c', padding: '6px', cursor: saving ? 'wait' : 'pointer', fontSize: '11px' }}>
                  Excluir
                </button>
              </div>
            )}
          </div>
        );
      }) : <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Nenhum evento corresponde aos filtros.</p>}
    </div>
  </div>
);

export default ProximosEventos;