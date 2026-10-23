// Dados provisórios para validar o seletor sem confundir agregados gerais com dados por matéria.
const materiasProfessorMock = [
  {
    id: "lingua-portuguesa",
    nome: "Língua Portuguesa",
    risco: {
      alunosAbaixoDaMedia: 3,
      alunosComFrequenciaInsuficiente: 1,
      alunosPorNota: [
        { id: "lp-nota-1", nome: "Estudante fictício 01", turma: "1º Ano A", mediaAtual: 52 },
        { id: "lp-nota-2", nome: "Estudante fictício 02", turma: "1º Ano B", mediaAtual: 57 },
        { id: "lp-nota-3", nome: "Estudante fictício 03", turma: "2º Ano A", mediaAtual: 49 },
      ],
      alunosPorFrequencia: [
        { id: "lp-frequencia-1", nome: "Estudante fictício 04", turma: "1º Ano A", frequenciaAtual: 72 },
      ],
    },
    medias: [
      { id: "lp-1a", turma: "1º Ano A", nota: 82 },
      { id: "lp-2a", turma: "2º Ano A", nota: 76 },
    ],
    frequencias: [
      { id: "lp-1a", turma: "1º Ano A", percentual: 91 },
      { id: "lp-2a", turma: "2º Ano A", percentual: 96 },
    ],
  },
  {
    id: "matematica",
    nome: "Matemática",
    risco: {
      alunosAbaixoDaMedia: 7,
      alunosComFrequenciaInsuficiente: 3,
      alunosPorNota: [
        { id: "mat-nota-1", nome: "Estudante fictício 01", turma: "1º Ano A", mediaAtual: 58 },
        { id: "mat-nota-2", nome: "Estudante fictício 02", turma: "1º Ano B", mediaAtual: 45 },
        { id: "mat-nota-3", nome: "Estudante fictício 03", turma: "1º Ano C", mediaAtual: 56 },
        { id: "mat-nota-4", nome: "Estudante fictício 04", turma: "2º Ano A", mediaAtual: 39 },
        { id: "mat-nota-5", nome: "Estudante fictício 05", turma: "2º Ano B", mediaAtual: 51 },
        { id: "mat-nota-6", nome: "Estudante fictício 06", turma: "3º Ano A", mediaAtual: 47 },
        { id: "mat-nota-7", nome: "Estudante fictício 07", turma: "3º Ano B", mediaAtual: 54 },
      ],
      alunosPorFrequencia: [
        { id: "mat-frequencia-1", nome: "Estudante fictício 08", turma: "1º Ano A", frequenciaAtual: 70 },
        { id: "mat-frequencia-2", nome: "Estudante fictício 09", turma: "2º Ano B", frequenciaAtual: 68 },
        { id: "mat-frequencia-3", nome: "Estudante fictício 10", turma: "3º Ano A", frequenciaAtual: 73 },
      ],
    },
    medias: [
      { id: "mat-1a", turma: "1º Ano A", nota: 58 },
      { id: "mat-2a", turma: "2º Ano A", nota: 68 },
    ],
    frequencias: [
      { id: "mat-1a", turma: "1º Ano A", percentual: 75 },
      { id: "mat-2a", turma: "2º Ano A", percentual: 82 },
    ],
  },
];

export default materiasProfessorMock;
