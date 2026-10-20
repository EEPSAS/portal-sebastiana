/**
 * Calendario.jsx - Grade Interativa do Calendário Escolar
 *
 * Papel Didático:
 * Renderiza os dias do mês em uma grade de 7 colunas (DOM a SÁB), exibindo
 * pontos coloridos para eventos e tarefas pessoais agendadas.
 * Todos os estilos estáticos foram movidos para `Agenda.css`, preservando estilos
 * inline exclusivamente para cores dinâmicas de eventos vindas do banco de dados.
 */

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const Calendario = ({
  visibleMonth,
  monthEvents,
  calendarDays,
  tasks,
  selectedDate,
  selectedDateLabel,
  selectedDateRelativeLabel,
  selectedTasks,
  taskTitle,
  getCategory,
  onChangeMonth,
  onGoToToday,
  onSelectCalendarDay,
  onAddTask,
  onTaskTitleChange,
  formatMonth,
  formatDateKey,
}) => (
  <div className="agenda-especialista-calendar">
    <div className="agenda-calendar-header">
      <div className="agenda-calendar-month">
        <h2 className="agenda-calendar-month-title">{formatMonth(visibleMonth)}</h2>
        <div className="agenda-calendar-month-controls">
          <button type="button" onClick={() => onChangeMonth(-1)} aria-label="Mês anterior">&lt;</button>
          <button type="button" onClick={() => onChangeMonth(1)} aria-label="Próximo mês">&gt;</button>
        </div>
      </div>
      <button type="button" onClick={onGoToToday} className="agenda-calendar-today">
        {selectedDateRelativeLabel}
      </button>
    </div>

    {/* Dias da Semana (DOM a SÁB) */}
    <div className="agenda-calendar-weekdays">
      {daysOfWeek.map((day) => (
        <span key={day} className="agenda-calendar-weekday-label">{day}</span>
      ))}
    </div>

    {/* Grade de Dias do Mês */}
    <div className="agenda-calendar-days-grid">
      {calendarDays.map((calendarDay) => {
        const dateKey = formatDateKey(calendarDay.date);
        const dayEvents = monthEvents.filter((event) => (
          event.date <= dateKey && (event.endDate || event.date) >= dateKey
        ));
        const dayTasks = tasks.filter((task) => task.date === dateKey);
        const isSelected = selectedDate === dateKey;

        return (
          <button
            type="button"
            key={dateKey}
            onClick={() => onSelectCalendarDay(calendarDay)}
            aria-label={`Marcar ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(calendarDay.date)}`}
            aria-pressed={isSelected}
            className="agenda-day-button"
          >
            <span
              className={`agenda-day-number ${
                isSelected ? 'is-selected' : ''
              } ${calendarDay.currentMonth ? 'is-current-month' : 'is-other-month'}`}
            >
              {calendarDay.day}
            </span>

            {/* Marcadores de Eventos e Tarefas do Dia */}
            {(dayEvents.length > 0 || dayTasks.length > 0) && (
              <span className="agenda-day-dots">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className="agenda-day-dot"
                    style={{ backgroundColor: event.color || getCategory(event.category).color }}
                  />
                ))}
                {dayTasks.length > 0 && <span className="agenda-day-dot-task" />}
              </span>
            )}
          </button>
        );
      })}
    </div>

    {/* Resumo do Dia Selecionado */}
    <p className="agenda-selected-date-info">
      Dia selecionado: <strong className="agenda-selected-date-label">{selectedDateLabel}</strong>
      {selectedDate && (
        <span className="agenda-selected-date-relative">{selectedDateRelativeLabel}</span>
      )}
    </p>

    {/* Formulário Rápido de Lembrete Pessoal */}
    <form onSubmit={onAddTask} className="agenda-task-form">
      <input
        type="text"
        value={taskTitle}
        onChange={(event) => onTaskTitleChange(event.target.value)}
        placeholder="Adicionar lembrete pessoal"
        aria-label="Nome da tarefa"
        disabled={!selectedDate}
        className="agenda-task-input"
      />
      <button
        type="submit"
        disabled={!selectedDate || !taskTitle.trim()}
        className="agenda-task-btn"
      >
        Marcar
      </button>
    </form>

    {/* Lista de Lembretes Pessoais Salvos */}
    {selectedTasks.length > 0 && (
      <div className="agenda-task-list-box">
        <strong>Lembretes pessoais</strong>
        {selectedTasks.map((task) => (
          <div key={task.id} className="agenda-task-item">• {task.title}</div>
        ))}
      </div>
    )}

    {monthEvents.length === 0 && (
      <p className="agenda-empty-events-msg">Nenhum evento visível neste mês.</p>
    )}
  </div>
);

export default Calendario;