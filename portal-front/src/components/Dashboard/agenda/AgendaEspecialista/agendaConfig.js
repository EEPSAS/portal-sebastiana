export const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: '#e6007e' },
  { key: 'provas', label: 'Provas e trabalhos', description: 'Matemática, Português, Biologia, História, Geografia, Química, Física e Artes', eventLabel: 'Avaliação', icon: '📄', color: '#f59e0b' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: '#2563eb' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: '#1e293b' },
];

const categoryByEventType = {
  evento: 'eventos',
  reuniao: 'eventos',
  prova: 'provas',
  data_importante: 'comemorativas',
  feriado: 'feriados',
};

const eventTypeByCategory = {
  eventos: 'evento',
  provas: 'prova',
  comemorativas: 'data_importante',
  feriados: 'feriado',
};

export const getCategoryFromEventType = (eventType) => categoryByEventType[eventType] || 'eventos';

export const getEventTypeFromCategory = (category) => eventTypeByCategory[category] || 'evento';