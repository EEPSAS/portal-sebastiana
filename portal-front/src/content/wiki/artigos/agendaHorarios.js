/**
 * agendaHorarios.js - Artigo Didático: Calendário Letivo e Grade Horária
 *
 * Conceito Didático:
 * Explica o funcionamento do Calendário Escolar integrado (eventos institucionais + pessoais)
 * e o gerador/editor interativo de Horários Escolares com drag & drop (@dnd-kit).
 */

export const artigoAgendaHorarios = {
  id: "agenda-calendario-horarios",
  titulo: "Calendário Escolar e Grade de Horários Semanais",
  categoriaId: "agenda",
  resumo: "Aprenda a consultar eventos letivos, feriados, recessos e a grade interativa de aulas por turma.",
  tempoLeituraMin: 4,
  perfisRecomendados: ["todos"],
  tags: ["agenda", "calendário", "horários", "drag and drop", "eventos", "sábados letivos"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "O módulo de Agenda integra a gestão do tempo escolar da EEPSAS. Ele garante que alunos, professores e coordenação compartilhem o mesmo cronograma oficial de aulas, avaliações e datas comemorativas.",
    },
    {
      tipo: "subtitulo",
      texto: "As 4 Abas da Agenda",
    },
    {
      tipo: "passos",
      itens: [
        "Calendário: Exibe o mês com marcações visuais de eventos institucionais da escola somados aos seus lembretes pessoais.",
        "Sábados Letivos: Cronograma com a programação pedagógica dos sábados de reposição de carga horária.",
        "Feriados e Recessos: Datas comemorativas municipais de Jaguaraçu-MG, estaduais e nacionais.",
        "Horário Escolar: Grade semanal interativa com as 5 a 6 aulas diárias por turma e turno.",
      ],
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Ajuste Interativo de Aulas (Drag & Drop)",
      texto: "A coordenação pedagógica pode reorganizar a grade semanal arrastando os blocos de disciplinas diretamente pela tela, utilizando a tecnologia interativa @dnd-kit integrada ao painel.",
    },
    {
      tipo: "acao",
      texto: "Ver Agenda e Horários",
      rota: "/dashboard/agenda?tab=calendario",
      icone: "bi-calendar-event",
    },
  ],
};
