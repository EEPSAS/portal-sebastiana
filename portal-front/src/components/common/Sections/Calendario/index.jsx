import { useState } from 'react';

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: '#e6007e' },
  { key: 'provas', label: 'Provas e avaliações', description: 'Provas, trabalhos e testes', eventLabel: 'Prova', icon: '📄', color: '#f59e0b' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: '#2563eb' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: '#1e293b' },
];

const events = [
  { id: 1, title: 'Feira de profissões', category: 'eventos', date: '2026-05-07' },
  { id: 2, title: 'Prova de matemática', category: 'provas', date: '2026-05-10' },
  { id: 3, title: 'Dia das Mães', category: 'comemorativas', date: '2026-05-12' },
  { id: 4, title: 'Corpus Christi', category: 'feriados', date: '2026-05-17' },
  { id: 5, title: 'Reunião de responsáveis', category: 'eventos', date: '2026-05-16' },
  { id: 6, title: 'Entrega do trabalho de ciências', category: 'provas', date: '2026-05-21' },
  { id: 7, title: 'Feira de profissões', category: 'eventos', date: '2026-05-24' },
  { id: 8, title: 'Festa Junina', category: 'eventos', date: '2026-06-13' },
  { id: 9, title: 'Prova de história', category: 'provas', date: '2026-06-18' },
  { id: 10, title: 'Independência do Brasil', category: 'feriados', date: '2026-09-07' },
  { id: 11, title: 'Dia dos Professores', category: 'comemorativas', date: '2026-10-15' },
  { id: 12, title: 'Ano Novo', category: 'comemorativas', date: '2027-01-01' },
  { id: 13, title: 'Carnaval', category: 'comemorativas', date: '2027-02-09' },
  { id: 14, title: 'Dia Internacional da Mulher', category: 'comemorativas', date: '2027-03-08' },
  { id: 15, title: 'Tiradentes', category: 'feriados', date: '2027-04-21' },
  { id: 16, title: 'Dia do Trabalho', category: 'feriados', date: '2027-05-01' },
  { id: 17, title: 'Dia das Mães', category: 'comemorativas', date: '2027-05-09' },
  { id: 18, title: 'Corpus Christi', category: 'feriados', date: '2027-05-27' },
  { id: 19, title: 'Dia Mundial do Meio Ambiente', category: 'comemorativas', date: '2027-06-05' },
  { id: 20, title: 'Dia dos Namorados', category: 'comemorativas', date: '2027-06-12' },
  { id: 21, title: 'Festa Junina', category: 'eventos', date: '2027-06-19' },
  { id: 22, title: 'Independência do Brasil', category: 'feriados', date: '2027-09-07' },
  { id: 23, title: 'Nossa Senhora Aparecida', category: 'feriados', date: '2027-10-12' },
  { id: 24, title: 'Dia das Crianças', category: 'comemorativas', date: '2027-10-12' },
  { id: 25, title: 'Dia dos Professores', category: 'comemorativas', date: '2027-10-15' },
  { id: 26, title: 'Finados', category: 'feriados', date: '2027-11-02' },
  { id: 27, title: 'Proclamação da República', category: 'feriados', date: '2027-11-15' },
  { id: 28, title: 'Dia da Consciência Negra', category: 'comemorativas', date: '2027-11-20' },
  { id: 29, title: 'Natal', category: 'feriados', date: '2027-12-25' },
];

const initialMonth = new Date(2026, 4, 1);
const initialSelectedDate = '2026-05-27';

const formatMonth = (date) => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
}).format(date).replace(/^(.)/, (letter) => letter.toUpperCase());

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getCalendarDays = (month) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return { date, day: date.getDate(), currentMonth: date.getMonth() === month.getMonth() };
  });
};

const CalendarioSection = () => {
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(categoryOptions.map(({ key }) => key)),
  );
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');

  const visibleEvents = events.filter(({ category }) => activeCategories.has(category));
  const monthEvents = visibleEvents.filter(({ date }) => date.startsWith(getMonthKey(visibleMonth)));
  const calendarDays = getCalendarDays(visibleMonth);
  const listedEvents = (showAllEvents ? visibleEvents : monthEvents).slice().sort((first, second) => (
    first.date.localeCompare(second.date)
  ));

  const getCategory = (categoryKey) => categoryOptions.find(({ key }) => key === categoryKey);

  const changeMonth = (amount) => {
    setVisibleMonth((currentMonth) => new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + amount,
      1,
    ));
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
    setSelectedDate((currentDate) => (currentDate === dateKey ? null : dateKey));
    if (!calendarDay.currentMonth) {
      setVisibleMonth(new Date(calendarDay.date.getFullYear(), calendarDay.date.getMonth(), 1));
    }
  };

  const addTask = (event) => {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!selectedDate || !title) {
      return;
    }

    setTasks((currentTasks) => [
      ...currentTasks,
      { id: Date.now(), title, date: selectedDate },
    ]);
    setTaskTitle('');
  };

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${selectedDate}T00:00:00`))
    : 'Nenhum dia marcado';
  const selectedTasks = tasks.filter((task) => task.date === selectedDate);

  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{
        position: 'relative', borderRadius: '16px', overflow: 'hidden',
        backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.85) 30%, rgba(255, 255, 255, 0.2) 100%), url("/assets/escola.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center', padding: '50px 40px',
        marginBottom: '30px', border: '1px solid #e2e8f0',
      }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '-0.5px', margin: 0 }}>
          CALENDÁRIO ESCOLAR
        </h1>
        <p style={{ fontSize: '15px', color: '#1e293b', marginTop: '10px', maxWidth: '420px', lineHeight: '1.4' }}>
          Fique por dentro de todos os eventos, provas e datas importantes da nossa escola.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '24px',
        background: '#ffffff', padding: '24px', borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', border: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Categorias</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {categoryOptions.map((category) => {
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
                    type="checkbox" checked={isActive} onChange={() => toggleCategory(category.key)}
                    aria-label={`Mostrar ${category.label}`}
                    style={{ accentColor: category.color, width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </label>
              );
            })}
          </div>
          <button type="button" onClick={() => setActiveCategories(new Set())} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#e6007e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🧹 Limpar filtros
          </button>
        </div>

        <div style={{ borderLeft: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', margin: 0 }}>{formatMonth(visibleMonth)}</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" style={{ border: 0, background: 'transparent', color: '#e6007e', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>&lt;</button>
                <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" style={{ border: 0, background: 'transparent', color: '#e6007e', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>&gt;</button>
              </div>
            </div>
            <button type="button" onClick={goToToday} style={{ background: 'transparent', border: '1px solid #e6007e', color: '#e6007e', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              Hoje
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
                  type="button" key={dateKey} onClick={() => selectCalendarDay(calendarDay)}
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
            Dia marcado: <strong style={{ color: '#1e3a8a' }}>{selectedDateLabel}</strong>
          </p>
          <form onSubmit={addTask} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Marcar uma tarefa"
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
              <strong>Tarefas do dia</strong>
              {selectedTasks.map((task) => <div key={task.id} style={{ marginTop: '4px' }}>• {task.title}</div>)}
            </div>
          )}
          {monthEvents.length === 0 && <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: '18px 0 0' }}>Nenhum evento visível neste mês.</p>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Próximos eventos</h3>
            <button type="button" onClick={() => setShowAllEvents((currentValue) => !currentValue)} style={{ border: 0, background: 'transparent', fontSize: '12px', color: '#e6007e', cursor: 'pointer', fontWeight: '600' }}>
              {showAllEvents ? 'Ver menos' : 'Ver todos'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {listedEvents.length > 0 ? listedEvents.map((event) => {
              const category = getCategory(event.category);
              const isSelected = selectedDate === event.date;
              return (
                <button type="button" key={event.id} onClick={() => selectEvent(event)} aria-pressed={isSelected} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', border: isSelected ? `2px solid ${category.color}` : '1px solid #e2e8f0', borderRadius: '14px', background: '#fff', padding: '8px', cursor: 'pointer' }}>
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
      </div>
    </section>
  );
};

export default CalendarioSection;
