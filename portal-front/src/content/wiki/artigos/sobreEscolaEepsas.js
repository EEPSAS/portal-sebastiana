/**
 * sobreEscolaEepsas.js - Artigo Didático: História e Identidade da EEPSAS
 *
 * Conceito Didático:
 * Resgata a história de fundação da Escola Estadual Professora Sebastiana de
 * Almeida e Silva em Jaguaraçu-MG, sua missão educacional e dados de contato.
 */

export const artigoSobreEscolaEepsas = {
  id: "historia-identidade-eepsas",
  titulo: "História e Identidade da E.E. Professora Sebastiana",
  categoriaId: "sobre-escola",
  resumo: "Conheça a trajetória da instituição escolar situada em Jaguaraçu-MG, sua patrona e seus princípios pedagógicos.",
  tempoLeituraMin: 4,
  perfisRecomendados: ["todos"],
  tags: ["história", "eepsas", "jaguaraçu", "patrona", "missão", "contato"],
  atualizadoEm: "08/11/2026",
  secoes: [
    {
      tipo: "paragrafo",
      texto: "A Escola Estadual Professora Sebastiana de Almeida e Silva (EEPSAS) é um centro de excelência em educação pública localizado no município de Jaguaraçu, no Vale do Aço mineiro. Ao longo de décadas, a escola tem sido o alicerce na formação cidadã e técnica de gerações de jovens da região.",
    },
    {
      tipo: "subtitulo",
      texto: "A Patrona Sebastiana de Almeida e Silva",
    },
    {
      tipo: "paragrafo",
      texto: "Educadora apaixonada pelas letras e pela emancipação pelo conhecimento, a Professora Sebastiana marcou a história do município por sua dedicação incansável aos alunos, incentivando a leitura, a arte e a solidariedade comunitária.",
    },
    {
      tipo: "alerta",
      variante: "success",
      titulo: "Missão e Valores",
      texto: "Proporcionar uma educação pública integral de alta qualidade, aliando o rigor científico à sensibilidade humana e às novas tecnologias digitais.",
    },
    {
      tipo: "subtitulo",
      texto: "Localização e Contato",
    },
    {
      tipo: "passos",
      itens: [
        "Endereço: Centro, Jaguaraçu - MG, CEP 35188-000",
        "Telefone da Secretaria: (31) 3845-1234",
        "Horário de Atendimento: Segunda a Sexta, das 07h às 17h",
      ],
    },
    {
      tipo: "acao",
      texto: "Ver Seção Sobre Nós no Portal",
      rota: "/#Sobre-nos",
      icone: "bi-building",
    },
  ],
};
