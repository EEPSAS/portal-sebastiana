/**
 * categorias.js - Catálogo Oficial de Categorias da Wiki do Portal Sebastiana
 *
 * Papel Didático:
 * Centraliza os eixos temáticos da base de conhecimento da escola.
 * Reflete tanto as seções institucionais/gerais quanto os módulos oficiais
 * presentes no menu lateral (Aside) do Dashboard.
 */

export const CATEGORIAS_WIKI = [
  {
    id: "comecando",
    nome: "Começando no Portal",
    descricao: "Primeiros passos, login com e-mail ou Google, perfis de acesso e navegação básica.",
    icone: "bi-rocket-takeoff-fill",
    corBadge: "bg-primary",
    ordem: 1,
  },
  {
    id: "academico",
    nome: "Acadêmico",
    descricao: "Turmas, matrículas, boletim escolar, diários consolidados e matriz curricular.",
    icone: "bi-mortarboard-fill",
    corBadge: "bg-success",
    ordem: 2,
  },
  {
    id: "agenda",
    nome: "Agenda & Horários",
    descricao: "Calendário escolar, eventos pedagógicos, recessos, sábados letivos e grade horária.",
    icone: "bi-calendar-event-fill",
    corBadge: "bg-info text-dark",
    ordem: 3,
  },
  {
    id: "biblioteca",
    nome: "Conteúdo & Biblioteca",
    descricao: "Consulta de acervo físico, empréstimos, curadoria de videoaulas e planos de estudos.",
    icone: "bi-collection-play-fill",
    corBadge: "bg-warning text-dark",
    ordem: 4,
  },
  {
    id: "noticias",
    nome: "Notícias & Comunicação",
    descricao: "Informativos da escola, rádio escolar (Radioatividade/Podcast) e avisos institucionais.",
    icone: "bi-newspaper",
    corBadge: "bg-danger",
    ordem: 5,
  },
  {
    id: "usuarios",
    nome: "Gestão de Usuários",
    descricao: "Controle de acessos, aprovação de vínculos docentes, segurança e configurações.",
    icone: "bi-shield-lock-fill",
    corBadge: "bg-secondary",
    ordem: 6,
  },
  {
    id: "dona-nana",
    nome: "Assistente Dona Nana",
    descricao: "Conheça a patrona da escola e aprenda a usar a mentora virtual inteligente.",
    icone: "bi-chat-heart-fill",
    corBadge: "bg-primary",
    ordem: 7,
  },
  {
    id: "sobre-escola",
    nome: "Sobre a EEPSAS",
    descricao: "História da Escola Professora Sebastiana, localização em Jaguaraçu-MG e contatos.",
    icone: "bi-building",
    corBadge: "bg-dark",
    ordem: 8,
  },
];

/**
 * Retorna uma categoria específica pelo seu identificador único.
 */
export const obterCategoriaPorId = (categoriaId) => {
  return CATEGORIAS_WIKI.find((cat) => cat.id === categoriaId) || null;
};
