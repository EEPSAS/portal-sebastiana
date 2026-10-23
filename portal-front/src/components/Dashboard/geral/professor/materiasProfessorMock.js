// Dados provisórios para validar o seletor sem confundir agregados gerais com dados por matéria.
const materiasProfessorMock = [
  {
    id: "lingua-portuguesa",
    nome: "Língua Portuguesa",
    risco: {
      alunosAbaixoDaMedia: 3,
      alunosComFrequenciaInsuficiente: 1,
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
