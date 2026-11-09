/**
 * turmasMatriculas.js - Artigo Didático: Gestão de Turmas e Matrículas
 *
 * Conceito Didático:
 * Explica a organização de ciclos curriculares, turnos escolares e como o
 * professor consulta sua lista de alunos enquanto o especialista realiza as enturmações.
 */

export const artigoTurmasMatriculas = {
  id: "turmas-e-matriculas",
  titulo: "Organização de Turmas, Ciclos e Matrículas",
  categoriaId: "academico",
  resumo: "Entenda a estrutura de turnos, ciclos curriculares, enturmação de alunos e a consulta docente às turmas vinculadas.",
  tempoLeituraMin: 4,
  perfisRecomendados: ["professor", "especialista", "adm"],
  tags: ["turmas", "ciclos", "turnos", "matrículas", "quadro docente"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "As turmas na EEPSAS são organizadas combinando o Ano Letivo, o Ciclo Curricular (ex.: Ensino Fundamental II, Ensino Médio) e o Turno Escolar (Manhã, Tarde ou Noite).",
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Visão Consultiva do Professor",
      texto: "Para garantir segurança e foco pedagógico, a role de Professor possui acesso estritamente consultivo aos dados das suas turmas e alunos, visualizando diários, presenças e contatos sem risco de desconfiguração cadastral.",
    },
    {
      tipo: "subtitulo",
      texto: "Atribuições por Papel",
    },
    {
      tipo: "passos",
      itens: [
        "Especialista / Adm: Cadastram novas turmas, definem capacidade máxima de alunos e realizam as matrículas/enturmações.",
        "Especialista / Adm: Alocam os professores em suas respectivas disciplinas na tela 'Acadêmico' > 'Professores'.",
        "Professor: Acessa 'Minhas Turmas' no menu lateral e visualiza a listagem nominal de alunos, frequências consolidadas e relatórios estatísticos da classe.",
      ],
    },
    {
      tipo: "acao",
      texto: "Acessar Módulo de Turmas",
      rota: "/dashboard/turmas",
      icone: "bi-people-fill",
    },
  ],
};
