/**
 * Calendario.jsx - Calendário Escolar Institucional do Portal e Painel (Módulo 4)
 *
 * Papel Didático:
 * Atua como o componente visual unificado do Calendário:
 * 1. Exibe a grade de dias e eventos escolares com diferenciação visual nítida por categoria;
 * 2. Mantém as Datas Comemorativas sempre visíveis;
 * 3. Suporta filtros por: Eventos, Provas, Sábados Letivos e Feriados e Recessos;
 * 4. Aplica estilização refinada conforme solicitado:
 *    - Provas: tracejado vermelho ao redor do dia + bolinha colorida;
 *    - Sábados Letivos: fundo amarelado/bege (~50% opacidade) + bolinha colorida;
 *    - Feriados e Recessos: número do dia em vermelho + bolinha colorida;
 *    - Eventos: bolinha colorida.
 */

import { useState } from 'react';
import { useEventos } from '../../../hooks/useEventos';
import {
  categoryOptions,
  getCategoryDetails,
} from '../../../utils/agendaConfig';
import {
  createImportantDates,
  formatDateKey,
  formatMonth,
  formatRelativeDate,
  getCalendarDays,
  getMonthKey,
} from '../../../utils/agendaUtils';
import './calendario.css';

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Feriados e datas comemorativas nacionais fixas e móveis calculadas
const holidayEvents = createImportantDates();
const initialMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const CalendarioSection = ({
  showHero = true,
  embedded = false,
  publico = true,
  eventos: customEvents,
  loading: customLoading,
  error: customError,
  onEditEvent,
  onDeleteEvent,
}) => {
  const internalHook = useEventos({ publico });
  const apiEvents = customEvents ?? internalHook.eventos;
  const loading = customLoading ?? internalHook.loading;
  const error = customError ?? internalHook.error;

  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(categoryOptions.map(({ key }) => key))
  );
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Mescla eventos da API com feriados/datas nacionais sem duplicidade
  const uniqueApiEvents = apiEvents.filter(
    (apiEvent) =>
      !holidayEvents.some(
        (holiday) =>
          holiday.date === apiEvent.date &&
          holiday.title.toLocaleLowerCase() === apiEvent.title.toLocaleLowerCase()
      )
  );

  // Item 2.1: As datas comemorativas devem ser SEMPRE mostradas, independente do filtro de categorias
  const visibleEvents = [...holidayEvents, ...uniqueApiEvents].filter(
    ({ category }) => category === 'comemorativas' || activeCategories.has(category)
  );

  const monthStart = `${getMonthKey(visibleMonth)}-01`;
  const monthEnd = formatDateKey(
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
  );
  const monthEvents = visibleEvents.filter(
    ({ date, endDate }) => date <= monthEnd && (endDate || date) >= monthStart
  );
  const calendarDays = getCalendarDays(visibleMonth);
  const listedEvents = (showAllEvents ? visibleEvents : monthEvents)
    .slice()
    .sort((first, second) => first.date.localeCompare(second.date));

  const changeMonth = (amount) => {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1)
    );
    setShowAllEvents(false);
  };

  const goToToday = () => {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(formatDateKey(today));
    setShowAllEvents(false);
  };

  const toggleCategory = (categoryKey) => {
    setActiveCategories((currentCategories) => {
      const nextCategories = new Set(currentCategories);
      if (nextCategories.has(categoryKey)) {
        nextCategories.delete(categoryKey);
      } else {
        nextCategories.add(categoryKey);
      }
      return nextCategories;
    });
  };

  const selectEvent = (event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    setSelectedDate(event.date);
    setVisibleMonth(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
  };

  const selectCalendarDay = (calendarDay) => {
    const dateKey = formatDateKey(calendarDay.date);
    setSelectedDate(dateKey);
    if (!calendarDay.currentMonth) {
      setVisibleMonth(
        new Date(calendarDay.date.getFullYear(), calendarDay.date.getMonth(), 1)
      );
    }
  };

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
        new Date(`${selectedDate}T00:00:00`)
      )
    : 'Nenhum dia selecionado';
  const selectedDateRelativeLabel = formatRelativeDate(selectedDate);

  const selectedDayEvents = visibleEvents.filter(
    (event) => event.date <= selectedDate && (event.endDate || event.date) >= selectedDate
  );

  const isEmbedded = embedded || !showHero;

  return (
    <section
      id="calendario"
      className={`portal-calendar-section ${isEmbedded ? 'portal-calendar-section--embedded' : ''}`}
    >
      <div className="container">
        {showHero && (
          <div className="portal-calendar__hero">
            <span className="portal-calendar__hero-badge">Planejamento Escolar</span>
            <h1 className="portal-calendar__hero-title">CALENDÁRIO ESCOLAR</h1>
            <p className="portal-calendar__hero-desc">
              Fique por dentro de todos os eventos, avaliações, projetos e datas importantes cadastrados pela coordenação pedagógica.
            </p>
          </div>
        )}

        <div className="portal-calendar__grid">
          {/* Coluna 1: Categorias e Filtros Compactos (Item 2) */}
          <div className="portal-calendar__col-categories">
            <h3 className="portal-calendar__col-title">Categorias</h3>
            <div className="portal-calendar__categories-list">
              {categoryOptions.map((category) => {
                const isActive = activeCategories.has(category.key);
                return (
                  <label
                    key={category.key}
                    className={`portal-calendar__category-item ${isActive ? '' : 'is-inactive'}`}
                  >
                    <span className="portal-calendar__category-info">
                      <span
                        className="portal-calendar__category-icon"
                        style={{ background: category.color }}
                      >
                        {category.icon}
                      </span>
                      <span className="portal-calendar__category-text">
                        <strong>{category.label}</strong>
                        <span>{category.description}</span>
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleCategory(category.key)}
                      aria-label={`Mostrar ${category.label}`}
                      className="portal-calendar__category-checkbox"
                      style={{ accentColor: category.color }}
                    />
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setActiveCategories(new Set())}
              className="portal-calendar__clear-btn"
            >
              🧹 Limpar filtros
            </button>
          </div>

          {/* Coluna 2: Visão do Mês e Grid de Dias com Estilização Refinada (Item 2.3) */}
          <div className="portal-calendar__col-main">
            <div className="portal-calendar__month-header">
              <div className="portal-calendar__month-nav-group">
                <h2 className="portal-calendar__month-title">{formatMonth(visibleMonth)}</h2>
                <div className="portal-calendar__month-buttons">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    aria-label="Mês anterior"
                    className="portal-calendar__nav-btn"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    aria-label="Próximo mês"
                    className="portal-calendar__nav-btn"
                  >
                    &gt;
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={goToToday}
                className="portal-calendar__today-badge"
              >
                {selectedDateRelativeLabel}
              </button>
            </div>

            <div className="portal-calendar__weekdays">
              {daysOfWeek.map((day) => (
                <span key={day} className="portal-calendar__weekday">
                  {day}
                </span>
              ))}
            </div>

            <div className="portal-calendar__days-grid">
              {calendarDays.map((calendarDay) => {
                const dateKey = formatDateKey(calendarDay.date);
                const dayEvents = monthEvents.filter(
                  (event) =>
                    event.date <= dateKey && (event.endDate || event.date) >= dateKey
                );
                const isSelected = selectedDate === dateKey;

                // Identificadores visuais da proposta (Item 2.3)
                const hasProva = dayEvents.some((ev) => ev.category === 'provas');
                const hasSabadoLetivo = dayEvents.some((ev) => ev.category === 'sabados');
                const hasFeriado = dayEvents.some((ev) => ev.category === 'feriados');

                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => selectCalendarDay(calendarDay)}
                    aria-label={`Consultar ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(calendarDay.date)}`}
                    aria-pressed={isSelected}
                    className={`portal-calendar__day-cell ${isSelected ? 'is-selected' : ''} ${hasProva ? 'has-prova' : ''} ${hasSabadoLetivo ? 'has-sabado-letivo' : ''}`}
                  >
                    <span
                      className={`portal-calendar__day-number ${hasFeriado ? 'has-feriado-number' : ''}`}
                      style={{
                        color: isSelected
                          ? '#ffffff'
                          : hasFeriado
                            ? '#dc2626'
                            : calendarDay.currentMonth
                              ? 'var(--color-navy-dark)'
                              : '#94a3b8',
                        fontWeight: isSelected || calendarDay.currentMonth || hasFeriado ? '600' : '400',
                      }}
                    >
                      {calendarDay.day}
                    </span>

                    {/* Marcadores de bolinhas coloridas mantidos para todos os eventos (Item 2.3.1) */}
                    {dayEvents.length > 0 && (
                      <span className="portal-calendar__day-dots">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className="portal-calendar__day-dot"
                            style={{ background: getCategoryDetails(event.category).color }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="portal-calendar__selected-label">
              Dia selecionado: <strong>{selectedDateLabel}</strong>
              {selectedDate && (
                <span className="portal-calendar__selected-relative">
                  {selectedDateRelativeLabel}
                </span>
              )}
            </p>

            {/* Programação do dia selecionado */}
            {selectedDayEvents.length > 0 && (
              <div className="portal-calendar__tasks-box">
                <strong>Programação do dia selecionado</strong>
                {selectedDayEvents.map((ev) => (
                  <div key={ev.id} style={{ marginTop: '4px' }}>
                    • {ev.title}
                    {ev.location ? ` (${ev.location})` : ''}
                  </div>
                ))}
              </div>
            )}


          </div>

          {/* Coluna 3: Próximos Eventos */}
          <div className="portal-calendar__col-sidebar">
            <div className="portal-calendar__sidebar-header">
              <h3 className="portal-calendar__sidebar-title">Próximos eventos</h3>
              <button
                type="button"
                onClick={() => setShowAllEvents((currentValue) => !currentValue)}
                className="portal-calendar__toggle-all-btn"
              >
                {showAllEvents ? 'Ver menos' : 'Ver todos'}
              </button>
            </div>
            <div className="portal-calendar__events-list">
              {loading && (
                <p role="status" className="portal-calendar__empty-events">
                  Carregando programação oficial da escola...
                </p>
              )}

              {!loading && error && (
                <p role="alert" className="portal-calendar__empty-events">
                  Não foi possível carregar os eventos institucionais no momento. Exibindo feriados nacionais.
                </p>
              )}

              {listedEvents.length > 0 ? (
                listedEvents.map((event) => {
                  const category = getCategoryDetails(event.category);
                  const isSelected =
                    selectedDate >= event.date &&
                    selectedDate <= (event.endDate || event.date);
                  const isCustomEvent = Boolean(
                    event.id &&
                    !String(event.id).startsWith('feriado-') &&
                    !String(event.id).startsWith('data-')
                  );
                  const hasActions = isCustomEvent && Boolean(onEditEvent || onDeleteEvent);

                  return (
                    <div
                      key={event.id}
                      className={`portal-calendar__event-card ${isSelected ? 'is-selected' : ''}`}
                      style={{
                        borderLeft: `4px solid ${category.color}`,
                        borderColor: isSelected ? category.color : undefined,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => selectEvent(event)}
                        aria-pressed={isSelected}
                        className="portal-calendar__event-content-btn"
                      >
                        <span
                          className="portal-calendar__event-icon"
                          style={{ background: category.color }}
                        >
                          {category.icon}
                        </span>
                        <span className="portal-calendar__event-text">
                          <strong>{event.title}</strong>
                          <span>
                            {category.eventLabel} •{' '}
                            {new Intl.DateTimeFormat('pt-BR').format(
                              new Date(`${event.date}T00:00:00`)
                            )}
                          </span>
                        </span>
                      </button>

                      {hasActions && (
                        <div className="portal-calendar__event-actions" role="group" aria-label="Ações do evento">
                          {onEditEvent && (
                            <button
                              type="button"
                              className="portal-calendar__action-btn"
                              title="Editar evento"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEvent(event);
                              }}
                            >
                              ✏️
                            </button>
                          )}
                          {onDeleteEvent && (
                            <button
                              type="button"
                              className="portal-calendar__action-btn portal-calendar__action-btn--danger"
                              title="Excluir evento"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEvent(event);
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                !loading && (
                  <p className="portal-calendar__empty-events">
                    Nenhum evento corresponde aos filtros selecionados.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarioSection;
