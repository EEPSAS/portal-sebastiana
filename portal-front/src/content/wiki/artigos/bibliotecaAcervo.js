/**
 * bibliotecaAcervo.js - Artigo Didático: Biblioteca Escolar, Acervo e Planos de Estudos
 *
 * Conceito Didático:
 * Apresenta as 4 abas integradas da Biblioteca do Portal Sebastiana:
 * 1. Acervo Físico (com autopreenchimento Google Books API)
 * 2. Videoaulas (YouTube Data API v3)
 * 3. Conteúdo Web (Google Programmable Search Engine)
 * 4. Planos de Estudos (trilhas personalizadas)
 */

export const artigoBibliotecaAcervo = {
  id: "biblioteca-acervo-planos-estudos",
  titulo: "Biblioteca Escolar: Acervo, Empréstimos e Planos de Estudos",
  categoriaId: "biblioteca",
  resumo: "Conheça o catálogo de livros da escola, o sistema de reserva de exemplares, a busca de videoaulas e a criação de trilhas de aprendizagem.",
  tempoLeituraMin: 5,
  perfisRecomendados: ["todos"],
  tags: ["biblioteca", "livros", "google books", "youtube", "planos de estudo", "empréstimos"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "A Biblioteca Escolar do Portal Sebastiana vai muito além do empréstimo de livros físicos. Ela é um ecossistema completo de recursos pedagógicos digitais e presenciais divididos em 4 abas principais:",
    },
    {
      tipo: "tabela",
      colunas: ["Aba", "Tecnologia / Recurso", "Público-Alvo"],
      linhas: [
        ["1. Acervo de Livros", "Catálogo físico com Google Books API para busca de capas e ISBN", "Todos (gestão pela Bibliotecária)"],
        ["2. Videoaulas", "Pesquisa educativa conectada à YouTube Data API v3", "Alunos e Professores"],
        ["3. Busca Web", "Artigos didáticos via Google Programmable Search Engine", "Todos"],
        ["4. Planos de Estudos", "Trilhas de estudos organizadas com livros, vídeos e web", "Alunos e Professores"],
      ],
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Como Solicitar o Empréstimo de um Livro",
      texto: "Alunos e professores podem navegar pelo acervo, verificar se há exemplares disponíveis e clicar em 'Solicitar Empréstimo'. A Bibliotecária recebe o pedido no painel e efetiva a entrega física.",
    },
    {
      tipo: "subtitulo",
      texto: "Trilhas de Aprendizagem (Planos de Estudos)",
    },
    {
      tipo: "passos",
      itens: [
        "Acesse 'Conteúdo' > 'Plano de Estudos' no menu lateral.",
        "Clique em 'Novo Plano de Estudos' para criar uma trilha temática (ex.: 'Preparatório ENEM - Redação Nota 1000').",
        "Vincule os livros do acervo que servem de bibliografia.",
        "Adicione links de videoaulas do YouTube e artigos da web recomendados.",
        "Compartilhe o plano com sua turma para que todos os colegas estudem juntos.",
      ],
    },
    {
      tipo: "acao",
      texto: "Abrir Biblioteca Escolar",
      rota: "/dashboard/biblioteca",
      icone: "bi-book",
    },
  ],
};
