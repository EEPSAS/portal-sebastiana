/**
 * donaNanaMentora.js - Artigo Didático: A Mentora Virtual Dona Nana
 *
 * Conceito Didático:
 * Apresenta a figura histórica e inspiradora da patrona Professora Sebastiana
 * e detalha o funcionamento da assistente pedagógica com IA (Google Gemini).
 */

export const artigoDonaNanaMentora = {
  id: "assistente-mentora-dona-nana",
  titulo: "Dona Nana: A Mentora Pedagógica Inteligente",
  categoriaId: "dona-nana",
  resumo: "Descubra como a patrona da escola foi homenageada em uma assistente virtual afetuosa e inteligente conectada ao Google Gemini.",
  tempoLeituraMin: 3,
  perfisRecomendados: ["todos"],
  tags: ["dona nana", "inteligência artificial", "gemini", "apoio aos estudos", "patrona"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "A Dona Nana é a mentora pedagógica virtual do Portal Sebastiana. Inspirada na dedicação histórica da Professora Sebastiana de Almeida e Silva, a assistente oferece apoio escolar, dicas de estudo e acolhimento socioemocional aos estudantes e educadores.",
    },
    {
      tipo: "subtitulo",
      texto: "Como Interagir com a Dona Nana",
    },
    {
      tipo: "passos",
      itens: [
        "Widget Flutuante Global: Em qualquer tela do Dashboard, clique no avatar flutuante da Dona Nana no canto inferior direito para tirar dúvidas rápidas.",
        "Chat Dedicado: Acesse 'Dona Nana' na barra lateral para uma conversa imersiva e aprofundada.",
        "Configuração de Persona (Especialistas): Na rota '/dashboard/dona-nana/configuracao', a coordenação pode ajustar o tom de voz e as orientações pedagógicas da assistente.",
      ],
    },
    {
      tipo: "alerta",
      variante: "info",
      titulo: "Privacidade e Segurança",
      texto: "As conversas com a Dona Nana são estritamente pedagógicas e não expõem dados sensíveis de notas ou documentos pessoais.",
    },
    {
      tipo: "acao",
      texto: "Conversar com a Dona Nana",
      rota: "/dashboard/dona-nana",
      icone: "bi-chat-heart-fill",
    },
  ],
};
