export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatMonth = (date) => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
}).format(date).replace(/^(.)/, (letter) => letter.toUpperCase());

export const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const formatRelativeDate = (dateKey) => {
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

export const getCalendarDays = (month) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return { date, day: date.getDate(), currentMonth: date.getMonth() === month.getMonth() };
  });
};