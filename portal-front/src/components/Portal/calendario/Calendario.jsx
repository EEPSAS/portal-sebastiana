import { useEffect, useState } from 'react';
import './calendario.css';

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: '#0777D9' },
  { key: 'provas', label: 'Provas e trabalhos', description: 'Matemática, Português, Biologia, História, Geografia, Química, Física e Artes', eventLabel: 'Avaliação', icon: '📄', color: '#F24405' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: '#04328C' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: '#282E46' },
];

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fixedImportantDates = [
  ['01-01', 'Ano Novo', 'feriados'], ['03-08', 'Dia Internacional da Mulher', 'comemorativas'],
  ['04-21', 'Tiradentes', 'feriados'], ['05-01', 'Dia do Trabalho', 'feriados'],
  ['06-05', 'Dia Mundial do Meio Ambiente', 'comemorativas'], ['09-07', 'Independência do Brasil', 'feriados'],
  ['10-12', 'Nossa Senhora Aparecida', 'feriados'], ['10-12', 'Dia das Crianças', 'comemorativas'],
  ['10-15', 'Dia dos Professores', 'comemorativas'], ['11-02', 'Finados', 'feriados'],
  ['11-15', 'Proclamação da República', 'feriados'], ['11-20', 'Dia da Consciência Negra', 'comemorativas'],
  ['12-25', 'Natal', 'feriados'],
];

const getEaster = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, (h + l - 7 * m + 114) % 31 + 1);
};

const createImportantDates = () => Array.from({ length: 16 }, (_, index) => new Date().getFullYear() - 5 + index).flatMap((year) => {
  const easter = getEaster(year);
  const movableDates = [
    [-47, 'Carnaval', 'comemorativas'], [-2, 'Sexta-feira Santa', 'feriados'],
    [0, 'Páscoa', 'comemorativas'], [60, 'Corpus Christi', 'feriados'],
  ];
  const dates = fixedImportantDates.map(([monthDay, title, category]) => ({
    id: `${year}-${monthDay}-${title}`, title, category, date: `${year}-${monthDay}`,
  }));
  return dates.concat(movableDates.map(([offset, title, category]) => {
    const date = new Date(easter);
    date.setDate(date.getDate() + offset);
    return { id: `${year}-${title}`, title, category, date: formatDateKey(date) };
  }));
});

const events = createImportantDates();
const initialMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const tasksStorageKey = 'portal-sebastiana-calendar-tasks';

const getStoredTasks = () => {
  try {
    const storedTasks = window.localStorage.getItem(tasksStorageKey);
    if (!storedTasks) {
      return [];
    }

    const parsedTasks = JSON.parse(storedTasks);
    return Array.isArray(parsedTasks)
      ? parsedTasks.filter((task) => task?.id && task?.title && task?.date)
      : [];
  } catch {
    return [];
  }
};

const formatMonth = (date) => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
}).format(date).replace(/^(.)/, (letter) => letter.toUpperCase());

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatRelativeDate = (dateKey) => {
  if (!dateKey) return 'Nenhum dia selecionado';
  const selected = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const differenceInDays = Math.round((selected - todayAtMidnight) / 86400000);
  if (differenceInDays === 0) return 'Hoje';
  if (differenceInDays === 1) return 'Amanhã';
  if (differenceInDays === -1) return 'Ontem';
  if (differenceInDays > 0 && differenceInDays < 30) return `Em ${differenceInDays} dias`;
  if (differenceInDays < 0 && differenceInDays > -30) return `Há ${Math.abs(differenceInDays)} dias`;
  const months = Math.round(Math.abs(differenceInDays) / 30);
  return differenceInDays > 0 ? `Em ${months} ${months === 1 ? 'mês' : 'meses'}` : `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
};

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
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(categoryOptions.map(({ key }) => key)),
  );
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [tasks, setTasks] = useState(getStoredTasks);
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
    } catch {
      return;
    }
  }, [tasks]);

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
    setSelectedDate(dateKey);
    if (!calendarDay.currentMonth) {
      setVisibleMonth(new Date(calendarDay.date.getFullYear(), calendarDay.date.getMonth(), 1));
    }
  };

  const addTask = (event) => {
    event.preventDefault();
    const title = taskTitle.trim().slice(0, 120);
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
    : 'Nenhum dia selecionado';
  const selectedDateRelativeLabel = formatRelativeDate(selectedDate);
  const selectedTasks = tasks.filter((task) => task.date === selectedDate);

  return (
    <section id="calendario" className="portal-calendar-section">
      <div className="container">
        <div className="portal-calendar__hero">
          <span className="portal-calendar__hero-badge">Planejamento Escolar</span>
          <h1 className="portal-calendar__hero-title">CALENDÁRIO ESCOLAR</h1>
          <p className="portal-calendar__hero-desc">
            Fique por dentro de todos os eventos, avaliações, projetos e datas importantes da nossa escola.
          </p>
        </div>

        <div className="portal-calendar__grid">
          {/* Coluna 1: Categorias e Filtros */}
          <div className="portal-calendar__col-categories">
            <h3 className="portal-calendar__col-title">Categorias</h3>
            <div className="portal-calendar__categories-list">
              {categoryOptions.map((category) => {
                const isActive = activeCategories.has(category.key);
                return (
                  <label key={category.key} className="portal-calendar__category-item" style={{ opacity: isActive ? 1 : 0.6 }}>
                    <span className="portal-calendar__category-info">
                      <span className="portal-calendar__category-icon" style={{ background: category.color }}>
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
            <button type="button" onClick={() => setActiveCategories(new Set())} className="portal-calendar__clear-btn">
              🧹 Limpar filtros
            </button>
          </div>

          {/* Coluna 2: Visão do Mês e Grid de Dias */}
          <div className="portal-calendar__col-main">
            <div className="portal-calendar__month-header">
              <div className="portal-calendar__month-nav-group">
                <h2 className="portal-calendar__month-title">{formatMonth(visibleMonth)}</h2>
                <div className="portal-calendar__month-buttons">
                  <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" className="portal-calendar__nav-btn">&lt;</button>
                  <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" className="portal-calendar__nav-btn">&gt;</button>
                </div>
              </div>
              <button type="button" onClick={goToToday} className="portal-calendar__today-badge">
                {selectedDateRelativeLabel}
              </button>
            </div>

            <div className="portal-calendar__weekdays">
              {daysOfWeek.map((day) => (
                <span key={day} className="portal-calendar__weekday">{day}</span>
              ))}
            </div>

            <div className="portal-calendar__days-grid">
              {calendarDays.map((calendarDay) => {
                const dateKey = formatDateKey(calendarDay.date);
                const dayEvents = monthEvents.filter((event) => event.date === dateKey);
                const dayTasks = tasks.filter((task) => task.date === dateKey);
                const isSelected = selectedDate === dateKey;
                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => selectCalendarDay(calendarDay)}
                    aria-label={`Marcar ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(calendarDay.date)}`}
                    aria-pressed={isSelected}
                    className={`portal-calendar__day-cell ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span
                      className="portal-calendar__day-number"
                      style={{
                        color: isSelected ? '#ffffff' : (calendarDay.currentMonth ? 'var(--color-navy-dark)' : '#94a3b8'),
                        fontWeight: isSelected || calendarDay.currentMonth ? '600' : '400',
                      }}
                    >
                      {calendarDay.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="portal-calendar__day-dots">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span key={event.id} className="portal-calendar__day-dot" style={{ background: getCategory(event.category).color }} />
                        ))}
                        {dayTasks.length > 0 && <span className="portal-calendar__day-dot--task" />}
                      </span>
                    )}
                    {dayEvents.length === 0 && dayTasks.length > 0 && (
                      <span className="portal-calendar__day-dots">
                        <span className="portal-calendar__day-dot--task" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="portal-calendar__selected-label">
              Dia selecionado: <strong>{selectedDateLabel}</strong>
              {selectedDate && <span className="portal-calendar__selected-relative">{selectedDateRelativeLabel}</span>}
            </p>

            <form onSubmit={addTask} className="portal-calendar__task-form">
              <input
                type="text"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Adicionar lembrete pessoal..."
                aria-label="Nome da tarefa"
                disabled={!selectedDate}
                className="portal-calendar__task-input"
              />
              <button
                type="submit"
                disabled={!selectedDate || !taskTitle.trim()}
                className="portal-calendar__task-btn"
                style={{ opacity: !selectedDate || !taskTitle.trim() ? 0.5 : 1 }}
              >
                Marcar
              </button>
            </form>

            {selectedTasks.length > 0 && (
              <div className="portal-calendar__tasks-box">
                <strong>Lembretes pessoais</strong>
                {selectedTasks.map((task) => <div key={task.id} style={{ marginTop: '4px' }}>• {task.title}</div>)}
              </div>
            )}
            {monthEvents.length === 0 && <p className="portal-calendar__empty-month">Nenhum evento visível neste mês.</p>}
          </div>

          {/* Coluna 3: Próximos Eventos */}
          <div className="portal-calendar__col-sidebar">
            <div className="portal-calendar__sidebar-header">
              <h3 className="portal-calendar__sidebar-title">Próximos eventos</h3>
              <button type="button" onClick={() => setShowAllEvents((currentValue) => !currentValue)} className="portal-calendar__toggle-all-btn">
                {showAllEvents ? 'Ver menos' : 'Ver todos'}
              </button>
            </div>
            <div className="portal-calendar__events-list">
              {listedEvents.length > 0 ? listedEvents.map((event) => {
                const category = getCategory(event.category);
                const isSelected = selectedDate === event.date;
                return (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => selectEvent(event)}
                    aria-pressed={isSelected}
                    className="portal-calendar__event-card"
                    style={{
                      borderLeft: `4px solid ${category.color}`,
                      borderColor: isSelected ? category.color : undefined,
                    }}
                  >
                    <span className="portal-calendar__event-icon" style={{ background: category.color }}>
                      {category.icon}
                    </span>
                    <span>
                      <strong>{event.title}</strong>
                      <span>{category.eventLabel} • {new Intl.DateTimeFormat('pt-BR').format(new Date(`${event.date}T00:00:00`))}</span>
                    </span>
                  </button>
                );
              }) : <p className="portal-calendar__empty-events">Nenhum evento corresponde aos filtros.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarioSection;
