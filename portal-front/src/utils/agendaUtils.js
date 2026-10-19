/**
 * agendaUtils.js - Utilitários Compartilhados de Datas e Feriados (Módulo 4: Agenda)
 *
 * Papel Didático:
 * Centraliza as funções puras de cálculo de datas, grade mensal de 42 dias (6 semanas)
 * e cálculo de feriados móveis (algoritmo de Gauss/Meeus para a Páscoa).
 * Compartilhado entre o Calendário Público (somente leitura institucional) e a
 * Agenda do Dashboard (eventos institucionais + eventos pessoais do usuário logado),
 * eliminando duplicação de código (princípio DRY).
 */

/**
 * Formata um objeto Date no padrão ISO local AAAA-MM-DD para comparação segura de chaves.
 */
export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Lista de feriados nacionais e datas comemorativas fixas do calendário escolar brasileiro.
 */
export const fixedImportantDates = [
  ['01-01', 'Ano Novo', 'feriados'],
  ['03-08', 'Dia Internacional da Mulher', 'comemorativas'],
  ['04-21', 'Tiradentes', 'feriados'],
  ['05-01', 'Dia do Trabalho', 'feriados'],
  ['06-05', 'Dia Mundial do Meio Ambiente', 'comemorativas'],
  ['09-07', 'Independência do Brasil', 'feriados'],
  ['10-12', 'Nossa Senhora Aparecida', 'feriados'],
  ['10-12', 'Dia das Crianças', 'comemorativas'],
  ['10-15', 'Dia dos Professores', 'comemorativas'],
  ['11-02', 'Finados', 'feriados'],
  ['11-15', 'Proclamação da República', 'feriados'],
  ['11-20', 'Dia da Consciência Negra', 'comemorativas'],
  ['12-25', 'Natal', 'feriados'],
];

/**
 * Calcula o domingo de Páscoa para um determinado ano usando o algoritmo de Meeus/Jones/Butcher.
 */
export const getEaster = (year) => {
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
  return new Date(
    year,
    Math.floor((h + l - 7 * m + 114) / 31) - 1,
    ((h + l - 7 * m + 114) % 31) + 1
  );
};

/**
 * Gera a lista de feriados nacionais fixos e móveis para uma janela de 16 anos ao redor do ano atual.
 */
export const createImportantDates = () =>
  Array.from({ length: 16 }, (_, index) => new Date().getFullYear() - 5 + index).flatMap((year) => {
    const easter = getEaster(year);
    const movableDates = [
      [-47, 'Carnaval', 'comemorativas'],
      [-2, 'Sexta-feira Santa', 'feriados'],
      [0, 'Páscoa', 'comemorativas'],
      [60, 'Corpus Christi', 'feriados'],
    ];
    const dates = fixedImportantDates.map(([monthDay, title, category]) => ({
      id: `${year}-${monthDay}-${title}`,
      title,
      category,
      date: `${year}-${monthDay}`,
    }));
    return dates.concat(
      movableDates.map(([offset, title, category]) => {
        const date = new Date(easter);
        date.setDate(date.getDate() + offset);
        return { id: `${year}-${title}`, title, category, date: formatDateKey(date) };
      })
    );
  });

/**
 * Formata o cabeçalho do mês e ano em português (ex.: "Outubro de 2026").
 */
export const formatMonth = (date) =>
  new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replace(/^(.)/, (letter) => letter.toUpperCase());

/**
 * Retorna a chave de mês no formato AAAA-MM para filtragem rápida.
 */
export const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Calcula um rótulo amigável relativo à data de hoje ("Hoje", "Amanhã", "Em 5 dias", etc.).
 */
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
  return differenceInDays > 0
    ? `Em ${months} ${months === 1 ? 'mês' : 'meses'}`
    : `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
};

/**
 * Constrói a matriz fixa de 42 células (6 semanas x 7 dias) para preencher a grade do calendário.
 */
export const getCalendarDays = (month) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstVisibleDay = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - firstDay.getDay()
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return {
      date,
      day: date.getDate(),
      currentMonth: date.getMonth() === month.getMonth(),
    };
  });
};

