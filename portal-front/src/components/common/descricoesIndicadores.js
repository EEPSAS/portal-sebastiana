/**
 * descricoesIndicadores.js - Dicionário de Definições Pedagógicas dos Indicadores Escolares
 *
 * Papel Didático:
 * Centraliza os textos explicativos e regras de apuração dos indicadores analíticos
 * exibidos nos painéis Gerais (Aluno, Professor, Especialista, Bibliotecária e Administrador),
 * garantindo coerência pedagógica com o regimento escolar da EEPSAS.
 */

export const DESCRICOES_INDICADORES = {
  // Especialista & Administrador (Cards/EstatisticaDocenteCard.jsx)
  total_alunos: {
    titulo: "Total de Estudantes",
    texto: "Contagem total de estudantes matriculados e enturmados no ano letivo ativo.",
  },
  media_geral: {
    titulo: "Média Geral Escolar",
    texto: "Média aritmética das notas consolidadas de todas as turmas na etapa avaliativa selecionada (meta mínima de 60%).",
  },
  frequencia_media: {
    titulo: "Frequência Média Escolar",
    texto: "Percentual médio global de presença dos alunos calculado sobre os registros da escola (meta mínima legal de 75%).",
  },
  noticias_publicadas: {
    titulo: "Notícias e Comunicados",
    texto: "Total de comunicados, avisos e informativos pedagógicos publicados no portal escolar.",
  },

  // Professor (Cards/AlunosRiscoCards.jsx)
  risco_nota: {
    titulo: "Alunos em Risco por Nota",
    texto: "Estudantes com rendimento inferior a 60% dos pontos da etapa avaliativa na disciplina selecionada (requer intervenção pedagógica).",
  },
  risco_frequencia: {
    titulo: "Alunos em Risco por Frequência",
    texto: "Estudantes com frequência acumulada abaixo do mínimo legal de 75% na etapa ou ano letivo (risco de infrequência escolar).",
  },

  // Aluno / Padrão (Cards/FrequenciaGeralCard, NotasDestaqueCard, LeituraAtualCard)
  aluno_frequencia: {
    titulo: "Frequência Geral do Aluno",
    texto: "Sua taxa de presença global acumulada em todas as disciplinas no período selecionado (mantenha sempre acima de 75%).",
  },
  aluno_melhor_nota: {
    titulo: "Maior Desempenho",
    texto: "Disciplina em que você alcançou o maior rendimento de notas na etapa avaliativa selecionada.",
  },
  aluno_nota_atencao: {
    titulo: "Atenção Pedagógica",
    texto: "Disciplina com menor rendimento ou nota abaixo de 60%, exigindo maior dedicação e apoio nos estudos.",
  },
  aluno_leitura_atual: {
    titulo: "Leitura em Andamento",
    texto: "Livro do acervo escolar atualmente em seu poder ou registrado para leitura voluntária no período.",
  },

  // Bibliotecária (CirculacaoAtivaCard.jsx, DestaqueMesCard.jsx)
  biblioteca_circulacao: {
    titulo: "Circulação Ativa do Acervo",
    texto: "Total de livros e exemplares físicos atualmente emprestados para alunos ou servidores da escola.",
  },
  biblioteca_destaque: {
    titulo: "Destaque do Mês",
    texto: "Obra do acervo da biblioteca com o maior volume de empréstimos registrados no mês corrente.",
  },
};
