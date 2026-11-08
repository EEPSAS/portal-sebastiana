/**
 * noticiasPodcast.js - Artigo Didático: Comunicação, Notícias e Podcast
 *
 * Conceito Didático:
 * Explica o ecossistema de comunicação da EEPSAS, desde os comunicados oficiais
 * até a rádio escolar e podcasts produzidos pelos estudantes.
 */

export const artigoNoticiasPodcast = {
  id: "noticias-e-radio-podcast",
  titulo: "Comunicação Escolar: Notícias e Rádio Radioatividade",
  categoriaId: "noticias",
  resumo: "Saiba como funcionam as publicações no portal público e as transmissões de podcasts da rádio escolar.",
  tempoLeituraMin: 3,
  perfisRecomendados: ["todos"],
  tags: ["notícias", "podcast", "rádio escolar", "comunicação", "informativos"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "A comunicação transparente é um pilar da EEPSAS. O portal possui um feed de notícias aberto à comunidade e o projeto 'Radioatividade', podcast oficial dos estudantes.",
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Gestão Editorial",
      texto: "Especialistas e Administradores possuem acesso ao painel '/dashboard/noticias', onde redigem comunicados, inserem fotos de capa e definem a data de publicação.",
    },
    {
      tipo: "subtitulo",
      texto: "O Projeto Radioatividade",
    },
    {
      tipo: "paragrafo",
      texto: "Na página inicial do portal, qualquer visitante ou aluno pode ouvir os episódios mais recentes gravados pelos alunos no estúdio da escola, com entrevistas, debates culturais e boletins de ciências.",
    },
    {
      tipo: "acao",
      texto: "Ver Feed de Notícias do Portal",
      rota: "/#Noticias",
      icone: "bi-newspaper",
    },
  ],
};
