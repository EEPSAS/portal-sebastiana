/**
 * ProximosEventos.jsx - Lista Lateral de Eventos Agendados
 *
 * Papel Didático:
 * Renderiza a listagem ordenada de eventos futuros com base nas categorias selecionadas.
 * Permite alternar visualização completa ("Ver todos" / "Ver menos") e disparar ações
 * de criação, edição e exclusão de eventos customizados.
 * Estilizado através do arquivo `Agenda.css`, mantendo estilos inline estritamente
 * para as cores dinâmicas dos cartões (`eventColor`).
 */

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
      <h3 className="agenda-events-title">Próximos eventos</h3>
      <div className="agenda-events-actions">
        <button
          type="button"
          onClick={onToggleShowAll}
          className="agenda-events-toggle-btn"
        >
          {showAllEvents ? 'Ver menos' : 'Ver todos'}
        </button>
        <BotaoNovoEvento onClick={onAddEvent} />
      </div>
    </div>
    <div className="agenda-especialista-event-list">
      {loading && <p role="status" className="agenda-events-status-msg">Carregando eventos...</p>}
      {loadError && <p role="alert" className="agenda-events-error-msg">{loadError.message}</p>}
      {mutationError && <p role="alert" className="agenda-events-error-msg">{mutationError.message}</p>}
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
          <div
            key={event.id}
            className={`agenda-event-card ${isSelected ? 'is-selected' : ''}`}
            style={isSelected ? { borderColor: eventColor } : undefined}
          >
            <button
              type="button"
              onClick={() => onSelectEvent(event)}
              aria-pressed={isSelected}
              className="agenda-event-button"
            >
              <span
                className="agenda-event-icon"
                style={{ backgroundColor: eventColor }}
              >
                {category.icon}
              </span>
              <span className="agenda-event-details">
                <strong className="agenda-event-title">{event.title}</strong>
                <span className="agenda-event-badge">{category.eventLabel} • {dateLabel}</span>
                {event.description && <span title={event.description} className="agenda-event-desc">{event.description}</span>}
                {eventDetails && <span className="agenda-event-meta">{eventDetails}</span>}
              </span>
            </button>
            {event.isCustom && (
              <div className="agenda-event-btn-group">
                <button
                  type="button"
                  onClick={() => onEditEvent(event)}
                  aria-label={`Editar ${event.title}`}
                  title="Editar"
                  className="agenda-event-btn-edit"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(event)}
                  aria-label={`Excluir ${event.title}`}
                  title="Excluir"
                  className="agenda-event-btn-delete"
                >
                  Excluir
                </button>
              </div>
            )}
          </div>
        );
      }) : <p className="agenda-events-empty-msg">Nenhum evento corresponde aos filtros.</p>}
    </div>
  </div>
);

export default ProximosEventos;