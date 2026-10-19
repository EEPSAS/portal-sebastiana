/**
 * agendaConfig.js - Configuração de Categorias e Mapeamento de Tipos da Agenda
 *
 * Papel Didático:
 * Centraliza as categorias visuais do calendário escolar e a conversão bidirecional
 * entre as chaves do frontend e os tipos aceitos pela API Laravel.
 */

export const categoryOptions = [
  { key: 'eventos', label: 'Eventos', description: 'Palestras, feiras, reuniões', eventLabel: 'Evento', icon: '📅', color: '#0777D9' },
  { key: 'provas', label: 'Provas e trabalhos', description: 'Matemática, Português, Biologia, História, Geografia, Química, Física e Artes', eventLabel: 'Avaliação', icon: '📄', color: '#F24405' },
  { key: 'comemorativas', label: 'Datas comemorativas', description: 'Datas especiais e celebrações', eventLabel: 'Data comemorativa', icon: '⭐', color: '#04328C' },
  { key: 'feriados', label: 'Feriados e recessos', description: 'Feriados e períodos de recesso', eventLabel: 'Feriado', icon: '📖', color: '#282E46' },
];

// Mapeia os valores retornados pela API (TipoEvento) para a chave de categoria do frontend
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

// Mapeia a categoria selecionada no formulário React para o valor enviado à API
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

