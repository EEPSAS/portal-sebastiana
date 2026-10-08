import BotaoNovoEvento from './BotaoNovoEvento';

const ProximosEventos = ({
  listedEvents,
  loading,
  loadError,
  mutationError,
  showAllEvents,
  selectedDate,
  getCategory,
  onToggleShowAll,
  onSelectEvent,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) => (
  <div className="agenda-especialista-events">
    <div className="agenda-especialista-events-header">
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Próximos eventos</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button type="button" onClick={onToggleShowAll} style={{ border: 0, background: 'transparent', fontSize: '12px', color: '#e6007e', cursor: 'pointer', fontWeight: '600' }}>
          {showAllEvents ? 'Ver menos' : 'Ver todos'}
        </button>
        <BotaoNovoEvento onClick={onAddEvent} />
      </div>
    </div>
    <div className="agenda-especialista-event-list">
      {loading && <p role="status" style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Carregando eventos...</p>}
      {loadError && <p role="alert" style={{ color: '#b91c1c', fontSize: '12px', margin: 0 }}>{loadError.message}</p>}
      {mutationError && <p role="alert" style={{ color: '#b91c1c', fontSize: '12px', margin: 0 }}>{mutationError.message}</p>}
      {loading && listedEvents.length === 0 ? null : listedEvents.length > 0 ? listedEvents.map((event) => {
        const category = getCategory(event.category);
        const eventColor = event.color || category.color;
        const isSelected = selectedDate >= event.date && selectedDate <= (event.endDate || event.date);
        const dateFormatter = new Intl.DateTimeFormat('pt-BR');
        const dateLabel = event.endDate && event.endDate !== event.date
          ? `${dateFormatter.format(new Date(`${event.date}T00:00:00`))} - ${dateFormatter.format(new Date(`${event.endDate}T00:00:00`))}`
          : dateFormatter.format(new Date(`${event.date}T00:00:00`));
        const eventDetails = [
          event.allDay ? 'Dia inteiro' : [event.startTime, event.endTime].filter(Boolean).join(' - '),
          event.location,
          event.important ? 'Data importante' : null,
        ].filter(Boolean).join(' • ');

        return (
          <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', border: isSelected ? `2px solid ${eventColor}` : '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', padding: '6px' }}>
            <button type="button" onClick={() => onSelectEvent(event)} aria-pressed={isSelected} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, textAlign: 'left', border: 0, background: 'transparent', padding: '2px', cursor: 'pointer' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '6px', background: eventColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '14px', flexShrink: 0 }}>{category.icon}</span>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{event.title}</strong>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{category.eventLabel} • {dateLabel}</span>
                {event.description && <span title={event.description} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px', color: '#64748b' }}>{event.description}</span>}
                {eventDetails && <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px', color: '#64748b' }}>{eventDetails}</span>}
              </span>
            </button>
            {event.isCustom && (
              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                <button type="button" onClick={() => onEditEvent(event)} aria-label={`Editar ${event.title}`} title="Editar" style={{ border: 0, borderRadius: '6px', background: '#f1f5f9', color: '#475569', padding: '6px', cursor: 'pointer', fontSize: '11px' }}>
                  Editar
                </button>
                <button type="button" onClick={() => onDeleteEvent(event)} aria-label={`Excluir ${event.title}`} title="Excluir" style={{ border: 0, borderRadius: '6px', background: '#fff1f2', color: '#be123c', padding: '6px', cursor: 'pointer', fontSize: '11px' }}>
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