import { useEffect, useState } from 'react';
import Calendario from './Calendario';
import Categorias from './Categorias';
import ProximosEventos from './ProximosEventos';
import CadastroEventoModal from './CadastroEventoModal';
import { categoryOptions } from './agendaConfig';
import { useEventoModal } from '../../../../hooks/useEventoModal';
import { useEventoMutations } from '../../../../hooks/useEventoMutations';
import { useEventos } from '../../../../hooks/useEventos';
import {
  createImportantDates,
  formatDateKey,
  formatMonth,
  formatRelativeDate,
  getCalendarDays,
  getMonthKey,
} from './agendaUtils';

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

const AgendaEspecialista = () => {
  const { eventos: apiEvents, loading: eventsLoading, error: eventsError, refresh } = useEventos();
  const eventModal = useEventoModal();
  const mutations = useEventoMutations({ onSuccess: refresh });
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

  const uniqueApiEvents = apiEvents.filter((apiEvent) => !events.some((event) => (
    event.date === apiEvent.date && event.title.toLocaleLowerCase() === apiEvent.title.toLocaleLowerCase()
  )));
  const visibleEvents = [...events, ...uniqueApiEvents].filter(({ category }) => activeCategories.has(category));
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

  const saveEvent = async (event) => {
    const result = event.id ? await mutations.update(event) : await mutations.create(event);
    if (!result.success) return;

    const savedEvent = { ...event, ...result.data, isCustom: true };
    eventModal.close();
    selectEvent(savedEvent);
  };

  const deleteCustomEvent = async (event) => {
    if (!window.confirm(`Deseja excluir o evento "${event.title}"?`)) return;
    await mutations.remove(event.id);
  };

  const openNewEventModal = () => {
    mutations.clearError();
    eventModal.openNewEvent(selectedDate || formatDateKey(new Date()));
  };

  const openEditEventModal = (event) => {
    mutations.clearError();
    eventModal.openEditEvent(event);
  };

  const closeEventModal = () => {
    mutations.clearError();
    eventModal.close();
  };

  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${selectedDate}T00:00:00`))
    : 'Nenhum dia selecionado';
  const selectedDateRelativeLabel = formatRelativeDate(selectedDate);
  const selectedTasks = tasks.filter((task) => task.date === selectedDate);

  return (
    <section className="agenda-especialista-page">
      <div className="agenda-especialista-layout">
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
          loading={eventsLoading}
          loadError={eventsError}
          mutationError={eventModal.isOpen ? null : mutations.error}
          showAllEvents={showAllEvents}
          selectedDate={selectedDate}
          getCategory={getCategory}
          onToggleShowAll={() => setShowAllEvents((currentValue) => !currentValue)}
          onSelectEvent={selectEvent}
          onAddEvent={openNewEventModal}
          onEditEvent={openEditEventModal}
          onDeleteEvent={deleteCustomEvent}
        />
      </div>
      {eventModal.isOpen && (
        <CadastroEventoModal
          categories={categoryOptions}
          event={eventModal.eventBeingEdited}
          initialDate={eventModal.initialDate || selectedDate || formatDateKey(new Date())}
          error={mutations.error}
          saving={mutations.saving}
          onClose={closeEventModal}
          onSave={saveEvent}
        />
      )}
    </section>
  );
};

export default AgendaEspecialista;
