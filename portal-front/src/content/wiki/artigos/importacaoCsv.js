/**
 * importacaoCsv.js - Artigo Didático: Importação de Diários em CSV
 *
 * Conceito Didático:
 * Detalha o fluxo exclusivo de importação de diários consolidados (notas e frequência)
 * pelo Especialista, explicando os padrões de cabeçalho, multi-período e validação Zod.
 */

export const artigoImportacaoCsv = {
  id: "importacao-diarios-csv",
  titulo: "Manual de Importação de Diários Escolares via CSV",
  categoriaId: "academico",
  resumo: "Instruções passo a passo para Especialistas e Administradores importarem planilhas de notas e faltas com validação de homônimos.",
  tempoLeituraMin: 5,
  perfisRecomendados: ["especialista", "adm"],
  tags: ["csv", "diário", "importação", "especialista", "homônimos", "validação"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "No Portal Sebastiana, as notas e faltas dos estudantes não são alimentadas manualmente aula por aula. Toda a carga é realizada pelo Especialista Escolar por meio do upload de uma planilha consolidada em formato CSV, garantindo integridade e celeridade nos fechamentos bimestrais.",
    },
    {
      tipo: "alerta",
      variante: "warning",
      titulo: "Privilégio Operacional do Especialista",
      texto: "Apenas usuários com perfil 'especialista' ou 'adm' possuem permissão para realizar o upload do CSV e a limpeza de dados consolidados de uma turma.",
    },
    {
      tipo: "subtitulo",
      texto: "Estrutura Padrão do Arquivo CSV",
    },
    {
      tipo: "paragrafo",
      texto: "O arquivo deve ser codificado em UTF-8 com separador vírgula (,) ou ponto-e-vírgula (;). A primeira linha deve conter os cabeçalhos obrigatórios:",
    },
    {
      tipo: "tabela",
      colunas: ["Coluna", "Descrição", "Exemplo"],
      linhas: [
        ["matricula", "Número de matrícula do estudante", "202600123"],
        ["nome_aluno", "Nome completo do aluno", "Carlos Eduardo Silva"],
        ["disciplina", "Nome da disciplina da matriz", "Matemática"],
        ["periodo", "Identificador do bimestre/trimestre", "1º Bimestre"],
        ["nota", "Nota obtida (0 a 100)", "78.50"],
        ["faltas", "Total de faltas no período", "4"],
      ],
    },
    {
      tipo: "subtitulo",
      texto: "Passo a Passo da Importação",
    },
    {
      tipo: "passos",
      itens: [
        "Acesse 'Acadêmico' > 'Turmas' no menu lateral.",
        "Localize a turma desejada e clique no botão 'Ações' > 'Importar Notas / Frequência'.",
        "Selecione o arquivo CSV do seu computador.",
        "Se houver alunos com nomes homônimos ou divergências de cadastro, o assistente abrirá a etapa de 'Resolução Manual de Alunos'.",
        "Confirme a correlação de disciplinas e clique em 'Processar Importação'.",
        "Pronto! Os dados são gravados no banco de dados e refletidos imediatamente nos boletins de todos os alunos da turma.",
      ],
    },
    {
      tipo: "acao",
      texto: "Ir para Gestão de Turmas",
      rota: "/dashboard/turmas",
      icone: "bi-people-fill",
    },
  ],
};
