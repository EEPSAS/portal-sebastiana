/**
 * agendaConfig.js - Configuração de Categorias e Mapeamento de Tipos da Agenda
 *
 * Papel Didático:
 * Centraliza as categorias visuais do calendário escolar e a conversão bidirecional
 * entre as chaves do frontend e os tipos oficiais aceitos pela API Laravel.
 */

// 4 Categorias oficiais disponíveis para filtro e cadastro escolar
export const categoryOptions = [
  {
    key: 'eventos',
    label: 'Eventos',
    description: 'Palestras, feiras e reuniões',
    eventLabel: 'Evento',
    icon: '📅',
    color: '#0777D9',
  },
  {
    key: 'provas',
    label: 'Provas',
    description: 'Avaliações e exames escolares',
    eventLabel: 'Prova',
    icon: '📄',
    color: '#F24405',
  },
  {
    key: 'sabados',
    label: 'Sábados Letivos',
    description: 'Dias letivos programados aos sábados',
    eventLabel: 'Sábado Letivo',
    icon: '📆',
    color: '#d97706',
  },
  {
    key: 'feriados',
    label: 'Feriados e Recessos',
    description: 'Feriados e períodos de recesso',
    eventLabel: 'Feriado',
    icon: '📖',
    color: '#dc2626',
  },
];

// Metadados estáticos para datas comemorativas nacionais exibidas sempre
export const comemorativaCategory = {
  key: 'comemorativas',
  label: 'Datas Comemorativas',
  description: 'Datas comemorativas nacionais e celebrações',
  eventLabel: 'Data Comemorativa',
  icon: '⭐',
  color: '#04328C',
};

// Mapeia os valores retornados pela API (TipoEvento) para a chave de categoria do frontend
const apiTypeToCategory = {
  evento: 'eventos',
  eventos: 'eventos',
  reuniao: 'eventos',
  'reunião': 'eventos',
  prova: 'provas',
  provas: 'provas',
  'provas e trabalhos': 'provas',
  'sábado letivo': 'sabados',
  'sábados letivos': 'sabados',
  'sabado letivo': 'sabados',
  'sabados letivos': 'sabados',
  sabados: 'sabados',
  feriado: 'feriados',
  feriados: 'feriados',
  'feriados e recessos': 'feriados',
  data_importante: 'comemorativas',
  'datas comemorativas': 'comemorativas',
  'data comemorativa': 'comemorativas',
};

// Mapeia a categoria selecionada no formulário React para o valor enviado à API Laravel
const categoryToApiType = {
  eventos: 'Eventos',
  provas: 'Provas e Trabalhos',
  sabados: 'Sábados Letivos',
  feriados: 'Feriados e Recessos',
};

export const getCategoryFromApiType = (type) => (
  apiTypeToCategory[String(type || '').trim().toLocaleLowerCase('pt-BR')] || 'eventos'
);

export const getApiTypeFromCategory = (category) => categoryToApiType[category] || 'Eventos';

export const getCategoryDetails = (key) => {
  if (key === 'comemorativas') return comemorativaCategory;
  return categoryOptions.find((c) => c.key === key) || categoryOptions[0];
};
