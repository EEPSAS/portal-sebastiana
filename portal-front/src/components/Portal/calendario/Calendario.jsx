/**
 * Calendario.jsx - Calendário Escolar Institucional do Portal Público (Módulo 4)
 *
 * Papel Didático:
 * Representa a visão pública (somente leitura / 'read') do mesmo calendário
 * gerenciado pelo Especialista no Dashboard:
 * 1. Consome `useEventos({ token: null })` para buscar na API (`GET /api/eventos`)
 *    todos os eventos escolares institucionais cadastrados pelo Especialista/Adm;
 * 2. Combina esses eventos oficiais com os feriados nacionais calculados pelo
 *    utilitário compartilhado `src/utils/agendaUtils.js`;
 * 3. Trata os 3 estados assíncronos obrigatórios (Carregando, Erro Amigável e Vazio).
 */

import { useState } from 'react';
import { useEventos } from '../../../hooks/useEventos';
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

const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: '#0777D9' },
  { key: 'provas', label: 'Provas e trabalhos', description: 'Matemática, Português, Biologia, História, Geografia, Química, Física e Artes', eventLabel: 'Avaliação', icon: '📄', color: '#F24405' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: '#04328C' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: '#282E46' },
];

// Feriados e datas comemorativas nacionais fixas e móveis
const holidayEvents = createImportantDates();
const initialMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const CalendarioSection = ({
  showHero = true,
  publico = true,
  eventos: customEvents,
  loading: customLoading,
  error: customError,
  onEditEvent,
  onDeleteEvent,
}) => {
  // Se eventos customizados forem informados pelo container pai, usa-os; caso contrário busca na API
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

  // Mescla os eventos institucionais da escola (Especialista) com os feriados nacionais sem duplicar
  const uniqueApiEvents = apiEvents.filter(
    (apiEvent) =>
      !holidayEvents.some(
        (holiday) =>
          holiday.date === apiEvent.date &&
          holiday.title.toLocaleLowerCase() === apiEvent.title.toLocaleLowerCase()
      )
  );

  const visibleEvents = [...holidayEvents, ...uniqueApiEvents].filter(({ category }) =>
    activeCategories.has(category)
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

  const getCategory = (categoryKey) =>
    categoryOptions.find(({ key }) => key === categoryKey) || categoryOptions[0];

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

  // Eventos específicos do dia selecionado na grade
  const selectedDayEvents = visibleEvents.filter(
    (event) => event.date <= selectedDate && (event.endDate || event.date) >= selectedDate
  );

  return (
    <section id="calendario" className="portal-calendar-section">
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
          {/* Coluna 1: Categorias e Filtros */}
          <div className="portal-calendar__col-categories">
            <h3 className="portal-calendar__col-title">Categorias</h3>
            <div className="portal-calendar__categories-list">
              {categoryOptions.map((category) => {
                const isActive = activeCategories.has(category.key);
                return (
                  <label
                    key={category.key}
                    className="portal-calendar__category-item"
                    style={{ opacity: isActive ? 1 : 0.6 }}
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

          {/* Coluna 2: Visão do Mês e Grid de Dias (Somente Leitura Institucional) */}
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
                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => selectCalendarDay(calendarDay)}
                    aria-label={`Consultar ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(calendarDay.date)}`}
                    aria-pressed={isSelected}
                    className={`portal-calendar__day-cell ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span
                      className="portal-calendar__day-number"
                      style={{
                        color: isSelected
                          ? '#ffffff'
                          : calendarDay.currentMonth
                            ? 'var(--color-navy-dark)'
                            : '#94a3b8',
                        fontWeight: isSelected || calendarDay.currentMonth ? '600' : '400',
                      }}
                    >
                      {calendarDay.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="portal-calendar__day-dots">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className="portal-calendar__day-dot"
                            style={{ background: getCategory(event.category).color }}
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

            {/* Exibe os eventos institucionais do dia selecionado */}
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

            {monthEvents.length === 0 && (
              <p className="portal-calendar__empty-month">
                Nenhum evento escolar visível neste mês.
              </p>
            )}
          </div>

          {/* Coluna 3: Próximos Eventos Institucionais (3 Estados Assíncronos) */}
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
              {/* Estado 1: Carregando */}
              {loading && (
                <p role="status" className="portal-calendar__empty-events">
                  Carregando programação oficial da escola...
                </p>
              )}

              {/* Estado 2: Erro Amigável */}
              {!loading && error && (
                <p role="alert" className="portal-calendar__empty-events">
                  Não foi possível carregar os eventos institucionais no momento. Exibindo feriados nacionais.
                </p>
              )}

              {/* Estado 3: Lista ou Vazio */}
              {listedEvents.length > 0 ? (
                listedEvents.map((event) => {
                  const category = getCategory(event.category);
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

