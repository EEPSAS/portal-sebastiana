/**
 * gestaoUsuarios.js - Artigo Didático: Perfis e Segurança do Usuário
 *
 * Conceito Didático:
 * Detalha a matriz de perfis (Roles: Aluno, Professor, Bibliotecária, Especialista, Adm),
 * o fluxo de aprovação de vínculos e as configurações de segurança pessoal.
 */

export const artigoGestaoUsuarios = {
  id: "perfis-e-seguranca-usuarios",
  titulo: "Perfis de Acesso (RBAC), Permissões e Segurança",
  categoriaId: "usuarios",
  resumo: "Entenda as diferenças de acesso entre cada papel no sistema e como o Administrador gerencia aprovações.",
  tempoLeituraMin: 4,
  perfisRecomendados: ["especialista", "adm", "professor"],
  tags: ["perfis", "roles", "rbac", "segurança", "aprovação", "senha"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "O Portal Sebastiana adota um modelo rigoroso de controle de acesso baseado em papéis (Role-Based Access Control - RBAC). Cada tipo de conta possui acesso estritamente delimitado às suas responsabilidades.",
    },
    {
      tipo: "tabela",
      colunas: ["Papel (Role)", "Acesso Principal", "Restrições de Escopo"],
      linhas: [
        ["aluno", "Boletim, Agenda, Biblioteca, Dona Nana e Perfil", "Não edita notas nem turmas"],
        ["professor", "Consulta de turmas, grade horária, biblioteca e Dona Nana", "Acesso puramente consultivo a diários"],
        ["bibliotecaria", "Gestão completa do acervo de livros e empréstimos", "Não gerencia turmas ou notas"],
        ["especialista", "Gestão de turmas, CSV de notas, professores e notícias", "Coordenação pedagógica ampla"],
        ["adm", "Acesso irrestrito a todos os módulos e gestão de usuários", "Administração geral da plataforma"],
      ],
    },
    {
      tipo: "alerta",
      variante: "warning",
      titulo: "Aprovação de Novos Cadastros",
      texto: "Quando novos professores ou alunos se cadastram no portal, um badge vermelho com o total de pendências é exibido no menu lateral do Especialista e Administrador para validação prévia de segurança.",
    },
    {
      tipo: "acao",
      texto: "Ir para Gestão de Usuários",
      rota: "/dashboard/usuarios",
      icone: "bi-shield-lock-fill",
    },
  ],
};
