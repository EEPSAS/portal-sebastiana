import { useEffect, useState } from 'react';

const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: '#e6007e' },
  { key: 'provas', label: 'Provas e trabalhos', description: 'Matemática, Português, Biologia, História, Geografia, Química, Física e Artes', eventLabel: 'Avaliação', icon: '📄', color: '#f59e0b' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: '#2563eb' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: '#1e293b' },
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
              <div style={{ display: 'flex', gap: '4px', width: '72px', flexShrink: 0, justifyContent: 'center' }}>
                <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior" style={{ width: '32px', height: '32px', border: 0, borderRadius: '8px', background: '#fdf2f8', color: '#e6007e', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>&lt;</button>
                <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês" style={{ width: '32px', height: '32px', border: 0, borderRadius: '8px', background: '#fdf2f8', color: '#e6007e', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>&gt;</button>
              </div>
            </div>
            <button type="button" onClick={goToToday} style={{ background: 'transparent', border: '1px solid #e6007e', color: '#e6007e', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
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
            Dia selecionado: <strong style={{ color: '#1e3a8a' }}>{selectedDateLabel}</strong>
            {selectedDate && <span style={{ display: 'block', marginTop: '3px', color: '#e6007e', fontWeight: '700' }}>{selectedDateRelativeLabel}</span>}
          </p>
          <form onSubmit={addTask} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
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
