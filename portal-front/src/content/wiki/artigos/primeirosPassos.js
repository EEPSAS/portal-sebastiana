/**
 * primeirosPassos.js - Artigo Didático: Acesso e Navegação no Portal
 *
 * Conceito Didático:
 * Apresenta a arquitetura de acesso do Portal Sebastiana, explicando os métodos
 * de autenticação (OAuth Google e Credenciais locais) e como o sistema direciona o
 * usuário conforme seu papel institucional.
 */

export const artigoPrimeirosPassos = {
  id: "primeiros-passos-portal",
  titulo: "Como Acessar e Navegar no Portal Sebastiana",
  categoriaId: "comecando",
  resumo: "Guia completo para realizar login com o Google ou e-mail institucional, gerenciar sua sessão e entender os módulos do painel.",
  tempoLeituraMin: 3,
  perfisRecomendados: ["todos"],
  tags: ["login", "google oauth", "senha", "painel geral", "primeiro acesso"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "O Portal Sebastiana é a plataforma oficial de gestão pedagógica e comunicação da Escola Estadual Professora Sebastiana de Almeida e Silva (EEPSAS). Ele integra todas as áreas da vida escolar em um ambiente seguro e intuitivo.",
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Autenticação Rápida com Google",
      texto: "Se você possui uma conta institucional ou pessoal do Google, utilize o botão 'Entrar com o Google'. Ele autentica sua identidade de forma criptografada sem a necessidade de decorar novas senhas.",
    },
    {
      tipo: "subtitulo",
      texto: "1. Como realizar o primeiro acesso",
    },
    {
      tipo: "passos",
      itens: [
        "Acesse a página inicial do Portal Sebastiana através do endereço da escola.",
        "Clique no botão 'Sistema EEPSAS' no canto superior direito do cabeçalho.",
        "Escolha entre entrar com seu e-mail e senha cadastrados ou clicar em 'Entrar com o Google'.",
        "Ao entrar com sucesso, você será direcionado automaticamente para o seu Painel Geral personalizado.",
      ],
    },
    {
      tipo: "alerta",
      variante: "warning",
      titulo: "Atenção Docentes: Confirmação de Vínculo",
      texto: "Se você é professor e acabou de se cadastrar, seu acesso permanecerá na tela de 'Aguardando Confirmação' até que o Especialista ou Administrador da escola confirme sua lotação nas disciplinas correspondentes.",
    },
    {
      tipo: "subtitulo",
      texto: "2. Conhecendo a Interface do Painel",
    },
    {
      tipo: "paragrafo",
      texto: "O painel conta com uma barra lateral retrátil (Aside) com navegação organizada em grupos modulares: Acadêmico, Agenda e Conteúdo. Na base do menu, você tem acesso permanente às configurações do seu perfil e ao atendimento com a Dona Nana.",
    },
    {
      tipo: "acao",
      texto: "Ir para a Tela de Login",
      rota: "/login",
      icone: "bi-box-arrow-in-right",
    },
  ],
};
