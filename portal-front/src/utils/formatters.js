/**
 * formatters.js - Funções Utilitárias de Formatação para o Portal Sebastiana
 *
 * Papel Didático:
 * Centraliza regras de exibição e transformação visual de entidades pedagógicas:
 * - Formatação obrigatória de disciplinas concatenando Nome e Ciclo (Regra NOME + CICLO);
 * - Suporta objetos de disciplina, strings ou contextos específicos de ciclo/turma.
 */

/**
 * Concatena o nome da disciplina com o ciclo ao qual ela pertence no formato: NOME + CICLO.
 * Exemplo: "Língua Portuguesa - 1º Ano"
 *
 * @param {Object|string} disciplina Objeto contendo nome e ciclos ou string com o nome
 * @param {Object|string|null} cicloContextual Ciclo específico da seção ou turma (opcional)
 * @returns {string} Rótulo formatado no padrão "NOME - CICLO"
 */
export function formatarDisciplinaCiclo(disciplina, cicloContextual = null) {
  if (!disciplina) return "";
  const nome = typeof disciplina === "string" ? disciplina : disciplina.nome || "";

  let nomeCiclo = "";
  if (cicloContextual) {
    nomeCiclo = typeof cicloContextual === "string" ? cicloContextual : cicloContextual.nome || "";
  } else if (disciplina.ciclos && Array.isArray(disciplina.ciclos) && disciplina.ciclos.length > 0) {
    nomeCiclo = disciplina.ciclos
      .map((c) => (typeof c === "string" ? c : c.nome))
      .filter(Boolean)
      .join(" / ");
  } else if (disciplina.ciclo) {
    nomeCiclo = typeof disciplina.ciclo === "string" ? disciplina.ciclo : disciplina.ciclo.nome || "";
  } else if (disciplina.ciclo_nome) {
    nomeCiclo = String(disciplina.ciclo_nome);
  }

  return nomeCiclo ? `${nome} - ${nomeCiclo}` : nome;
}

