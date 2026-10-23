/**
 * rolesRoutes.js - Regras puras de role e rota inicial do Dashboard
 *
 * Papel Didático:
 * Centraliza em um só lugar as regras de normalização de papel (role) e determinação
 * da rota padrão de destino inicial. Evita duplicação de lógica entre redirecionamentos
 * de login, troca de visão e controle de acesso RBAC.
 */

// Grafias equivalentes convergem para a role oficial do backend (enum UserRole)
const ALIAS_DE_ROLE = {
  bibliotecario: "bibliotecaria", // grafia alternativa suportada pelo front
  padrao: "aluno",                // UserRole::PADRAO tem o mesmo acesso do aluno
};

/**
 * Garante sempre uma role normalizada válida; sem role definida, assume 'aluno'.
 *
 * @param {string} [role]
 * @returns {string}
 */
export const normalizarRole = (role) => ALIAS_DE_ROLE[role] ?? role ?? "aluno";

// Todas as roles agora possuem um painel Geral próprio servido na rota unificada
const ROTA_GERAL = "/dashboard/geral";

// Mapa de rota inicial por perfil
const ROTA_INICIAL_POR_ROLE = {
  aluno: ROTA_GERAL,
  professor: ROTA_GERAL,
  bibliotecaria: ROTA_GERAL,
  especialista: ROTA_GERAL,
  adm: ROTA_GERAL,
};

/**
 * Retorna o destino padrão de acesso para a role fornecida.
 *
 * @param {string} [role]
 * @returns {string}
 */
export const getRotaInicial = (role) =>
  ROTA_INICIAL_POR_ROLE[normalizarRole(role)] ?? ROTA_GERAL;
