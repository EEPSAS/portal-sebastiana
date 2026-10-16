export const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: 'var(--dashboard-pink)' },
  { key: 'provas', label: 'Provas e trabalhos', description: 'Matemática, Português, Biologia, História, Geografia, Química, Física e Artes', eventLabel: 'Avaliação', icon: '📄', color: 'var(--dashboard-amber)' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: 'var(--dashboard-navy)' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: 'var(--dashboard-navy)' },
];

const apiTypeToCategory = {
  evento: 'eventos',
  eventos: 'eventos',
  reuniao: 'eventos',
  prova: 'provas',
  'provas e trabalhos': 'provas',
  data_importante: 'comemorativas',
  'datas comemorativas': 'comemorativas',
  feriado: 'feriados',
  'feriados e recessos': 'feriados',
};

const categoryToApiType = {
  eventos: 'evento',
  provas: 'prova',
  comemorativas: 'data_importante',
  feriados: 'feriado',
};

export const getCategoryFromApiType = (type) => (
  apiTypeToCategory[String(type || '').trim().toLocaleLowerCase('pt-BR')] || 'eventos'
);

export const getApiTypeFromCategory = (category) => categoryToApiType[category] || 'evento';