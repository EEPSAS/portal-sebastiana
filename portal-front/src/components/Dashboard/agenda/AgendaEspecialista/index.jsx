import { useEffect, useState } from 'react';
import Calendario from './Calendario';
import Categorias from './Categorias';
import ProximosEventos from './ProximosEventos';

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
const tasksStorageKey = 'portal-sebastiana-calendar-tasks';

const getStoredTasks = () => {
  try {
    const storedTasks = window.localStorage.getItem(tasksStorageKey);
    if (!storedTasks) return [];

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

const AgendaEspecialista = () => {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
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
    if (!selectedDate || !title) return;

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
        <Categorias
          categories={categoryOptions}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          onClearCategories={() => setActiveCategories(new Set())}
        />
        <Calendario
          visibleMonth={visibleMonth}
          monthEvents={monthEvents}
          calendarDays={calendarDays}
          tasks={tasks}
          selectedDate={selectedDate}
          selectedDateLabel={selectedDateLabel}
          selectedDateRelativeLabel={selectedDateRelativeLabel}
          selectedTasks={selectedTasks}
          taskTitle={taskTitle}
          getCategory={getCategory}
          onChangeMonth={changeMonth}
          onGoToToday={goToToday}
          onSelectCalendarDay={selectCalendarDay}
          onAddTask={addTask}
          onTaskTitleChange={setTaskTitle}
          formatMonth={formatMonth}
          formatDateKey={formatDateKey}
        />
        <ProximosEventos
          listedEvents={listedEvents}
          showAllEvents={showAllEvents}
          selectedDate={selectedDate}
          getCategory={getCategory}
          onToggleShowAll={() => setShowAllEvents((currentValue) => !currentValue)}
          onSelectEvent={selectEvent}
        />
      </div>
    </section>
  );
};

export default AgendaEspecialista;
