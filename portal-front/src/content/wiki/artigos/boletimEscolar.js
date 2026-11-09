/**
 * boletimEscolar.js - Artigo Didático: Consulta e Entendimento do Boletim
 *
 * Conceito Didático:
 * Explica aos estudantes e responsáveis como interpretar notas ponderadas,
 * taxa de frequência escolar, recuperação e os gráficos analíticos em Recharts.
 */

export const artigoBoletimEscolar = {
  id: "boletim-escolar-notas-frequencia",
  titulo: "Como Consultar e Interpretar seu Boletim Escolar",
  categoriaId: "academico",
  resumo: "Entenda a distribuição de pontos por período letivo, a taxa mínima de frequência para aprovação e como acompanhar seu desempenho.",
  tempoLeituraMin: 4,
  perfisRecomendados: ["aluno", "professor", "adm"],
  tags: ["boletim", "notas", "frequência", "faltas", "recharts", "recuperação"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "O módulo de Boletim Escolar permite aos alunos e seus responsáveis acompanharem o rendimento acadêmico ao longo dos períodos letivos do ano corrente. Os dados apresentados são consolidados e certificados pela coordenação pedagógica da EEPSAS.",
    },
    {
      tipo: "alerta",
      variante: "success",
      titulo: "Critérios Oficiais de Aprovação",
      texto: "Para aprovação direta na disciplina, o aluno precisa atingir no mínimo 60% dos pontos distribuídos no ano letivo e uma frequência global de no mínimo 75% dos dias letivos.",
    },
    {
      tipo: "subtitulo",
      texto: "Gráficos Interativos e Indicadores Visuais",
    },
    {
      tipo: "paragrafo",
      texto: "O boletim utiliza a biblioteca gráfica Recharts para desenhar o comparativo de notas por disciplina e barras de frequência. Disciplinas em que o estudante atingiu a média aparecem destacadas em tons de azul e verde, enquanto rendimentos em atenção são sinalizados em amarelo ou vermelho.",
    },
    {
      tipo: "passos",
      itens: [
        "Acesse o menu lateral e clique em 'Acadêmico' > 'Boletim'.",
        "Selecione o ano letivo e o ciclo correspondente à sua turma atual.",
        "Analise a tabela com as notas detalhadas por bimestre/trimestre e a soma acumulada.",
        "Role até a seção analítica para visualizar o gráfico de barras comparativo de desempenho entre as matérias da BNCC.",
      ],
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Emissão e Impressão de Boletim",
      texto: "Você pode imprimir seu boletim ou salvá-lo em PDF utilizando a função nativa de impressão do navegador (Ctrl+P). O layout foi projetado para ajuste automático em folha A4.",
    },
    {
      tipo: "acao",
      texto: "Visualizar Meu Boletim",
      rota: "/dashboard/boletim",
      icone: "bi-journal-check",
    },
  ],
};
