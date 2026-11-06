/**
 * formatters.js - Funções Utilitárias de Formatação para o Portal Sebastiana
 *
 * Papel Didático:
 * Centraliza regras de exibição e transformação visual de entidades pedagógicas:
 * - Formatação obrigatória de disciplinas concatenando Nome e Ciclo (Regra NOME + CICLO);
 * - Suporta objetos de disciplina, strings ou contextos específicos de ciclo/turma;
 * - Fornece utilitários de filtragem e extração de ciclos para formulários de vinculação docente.
 */

/**
 * Concatena o nome da disciplina com o ciclo ao qual ela pertence no formato: NOME + CICLO.
 * Exemplo: "Língua Portuguesa - 1º Ano" ou "Filosofia - 2º Ano regular".
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

/**
 * Normaliza texto para comparação de busca (minúsculas e sem acentos).
 * Evita que "filosofia" não encontre "Filosofia" ou "Língua" não encontre "lingua".
 *
 * @param {string} texto
 * @returns {string}
 */
const normalizarBusca = (texto) =>
  String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Valor especial do filtro de ciclo para disciplinas que ainda não pertencem a nenhum ciclo.
 */
export const FILTRO_SEM_CICLO = "sem-ciclo";

/**
 * Extrai a lista única de ciclos presentes nas disciplinas (ordenada por nome),
 * usada para montar as opções do filtro de ciclo.
 *
 * @param {Array<Object>} disciplinas Catálogo de disciplinas com `ciclos: [{ id_ciclo, nome }]`
 * @returns {Array<{ id_ciclo: number|string, nome: string }>}
 */
export function listarCiclosDasDisciplinas(disciplinas = []) {
  const mapa = new Map();
  disciplinas.forEach((disciplina) => {
    (disciplina.ciclos || []).forEach((ciclo) => {
      if (ciclo && ciclo.id_ciclo !== undefined && !mapa.has(String(ciclo.id_ciclo))) {
        mapa.set(String(ciclo.id_ciclo), { id_ciclo: ciclo.id_ciclo, nome: ciclo.nome });
      }
    });
  });
  return Array.from(mapa.values()).sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
}

/**
 * Filtra disciplinas por ciclo e/ou nome, mantendo a ordenação por rótulo "Nome - Ciclo".
 *
 * @param {Array<Object>} disciplinas Catálogo de disciplinas
 * @param {{ ciclo?: string, termo?: string }} filtros `ciclo` = id do ciclo, FILTRO_SEM_CICLO ou "" (todos)
 * @returns {Array<Object>}
 */
export function filtrarDisciplinas(disciplinas = [], { ciclo = "", termo = "" } = {}) {
  const termoNormalizado = normalizarBusca(termo.trim());

  return disciplinas
    .filter((disciplina) => {
      const ciclosDaDisciplina = disciplina.ciclos || [];

      // Filtro por ciclo: se vazio aceita todos; se "sem-ciclo", aceita disciplinas sem ciclos vinculados
      const atendeCiclo =
        !ciclo ||
        (ciclo === FILTRO_SEM_CICLO
          ? ciclosDaDisciplina.length === 0
          : ciclosDaDisciplina.some((c) => String(c.id_ciclo) === String(ciclo)));

      // Filtro por termo: busca tanto no nome quanto no rótulo completo com ciclo
      const atendeNome =
        !termoNormalizado || normalizarBusca(formatarDisciplinaCiclo(disciplina)).includes(termoNormalizado);

      return atendeCiclo && atendeNome;
    })
    .sort((a, b) => formatarDisciplinaCiclo(a).localeCompare(formatarDisciplinaCiclo(b)));
}

