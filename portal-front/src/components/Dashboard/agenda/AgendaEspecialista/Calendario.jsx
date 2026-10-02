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
  <div style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '0 24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>{formatMonth(visibleMonth)}</h2>
        <div style={{ display: 'flex', gap: '4px', width: '72px', flexShrink: 0, justifyContent: 'center' }}>
          <button type="button" onClick={() => onChangeMonth(-1)} aria-label="Mês anterior" style={{ width: '32px', height: '32px', border: 0, borderRadius: '8px', background: '#fdf2f8', color: '#e6007e', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>&lt;</button>
          <button type="button" onClick={() => onChangeMonth(1)} aria-label="Próximo mês" style={{ width: '32px', height: '32px', border: 0, borderRadius: '8px', background: '#fdf2f8', color: '#e6007e', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>&gt;</button>
        </div>
      </div>
      <button type="button" onClick={onGoToToday} style={{ background: 'transparent', border: '1px solid #e6007e', color: '#e6007e', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
        {selectedDateRelativeLabel}
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px' }}>
      {daysOfWeek.map((day) => <span key={day} style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>{day}</span>)}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '12px', textAlign: 'center' }}>
      {calendarDays.map((calendarDay) => {
        const dateKey = formatDateKey(calendarDay.date);
        const dayEvents = monthEvents.filter((event) => event.date === dateKey);
        const dayTasks = tasks.filter((task) => task.date === dateKey);
        const isSelected = selectedDate === dateKey;
        return (
          <button
            type="button"
            key={dateKey}
            onClick={() => onSelectCalendarDay(calendarDay)}
            aria-label={`Marcar ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(calendarDay.date)}`}
            aria-pressed={isSelected}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '38px', border: 0, background: 'transparent', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: isSelected ? '8px' : '0', background: isSelected ? '#e6007e' : 'transparent', color: isSelected ? '#ffffff' : (calendarDay.currentMonth ? '#1e293b' : '#cbd5e1'), fontSize: '13px', fontWeight: isSelected || calendarDay.currentMonth ? '600' : '400' }}>
              {calendarDay.day}
            </span>
            {dayEvents.length > 0 && (
              <span style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '0px' }}>
                {dayEvents.slice(0, 3).map((event) => <span key={event.id} style={{ width: '5px', height: '5px', borderRadius: '50%', background: getCategory(event.category).color }} />)}
                {dayTasks.length > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a' }} />}
              </span>
            )}
            {dayEvents.length === 0 && dayTasks.length > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a', position: 'absolute', bottom: '0px' }} />}
          </button>
        );
      })}
    </div>
    <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: '14px 0 0' }}>
      Dia selecionado: <strong style={{ color: '#1e3a8a' }}>{selectedDateLabel}</strong>
      {selectedDate && <span style={{ display: 'block', marginTop: '3px', color: '#e6007e', fontWeight: '700' }}>{selectedDateRelativeLabel}</span>}
    </p>
    <form onSubmit={onAddTask} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
      <input
        type="text"
        value={taskTitle}
        onChange={(event) => onTaskTitleChange(event.target.value)}
        placeholder="Adicionar lembrete pessoal"
        aria-label="Nome da tarefa"
        disabled={!selectedDate}
        style={{ minWidth: 0, flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 8px', fontSize: '11px' }}
      />
      <button
        type="submit"
        disabled={!selectedDate || !taskTitle.trim()}
        style={{ border: 0, borderRadius: '8px', background: '#16a34a', color: '#fff', padding: '0 9px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', opacity: !selectedDate || !taskTitle.trim() ? 0.5 : 1 }}
      >
        Marcar
      </button>
    </form>
    {selectedTasks.length > 0 && (
      <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '8px', background: '#f0fdf4', color: '#166534', fontSize: '11px' }}>
        <strong>Lembretes pessoais</strong>
        {selectedTasks.map((task) => <div key={task.id} style={{ marginTop: '4px' }}>• {task.title}</div>)}
      </div>
    )}
    {monthEvents.length === 0 && <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: '18px 0 0' }}>Nenhum evento visível neste mês.</p>}
  </div>
);

export default Calendario;