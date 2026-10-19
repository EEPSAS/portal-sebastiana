/**
 * bibliotecaService.js - Serviço de Integração com o Módulo de Biblioteca
 *
 * Papel Didático:
 * Centraliza as chamadas à API RESTful do Laravel para gestão do acervo físico
 * escolar e controle de empréstimos, conforme especificado no `apiContract.md`.
 * Todas as requisições utilizam o utilitário nativo `api` que injeta o Bearer Token.
 */

import { api } from '../api';
import { getStoredToken } from '../authService';

/**
 * Verifica se o usuário possui sessão ativa (token no localStorage).
 * @returns {boolean}
 */
export const hasPortalSession = () => Boolean(getStoredToken());

/**
 * Utilitário didático para processamento de respostas JSON da API.
 */
const requestJson = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await api(path, { method, body, signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message || 'Falha ao processar a requisição na biblioteca escolar.'
    );
    error.status = response.status;
    error.validationErrors = payload?.errors ?? {};
    throw error;
  }

  return payload;
};

// ============================================================================
// 1. Catálogo de Livros Físicos (Rotas /api/livros)
// ============================================================================

/**
 * Lista todos os livros cadastrados no acervo da escola com suporte a filtros.
 * @param {object} [filtros] Filtros de busca (ex.: { q: 'Machado', genero: 'Literatura' }).
 */
export const listarLivros = async (filtros = {}, { signal } = {}) => {
  const params = new URLSearchParams();
  if (filtros.q) params.append('q', filtros.q);
  if (filtros.genero) params.append('genero', filtros.genero);
  if (filtros.autor) params.append('autor', filtros.autor);
  if (filtros.apenas_disponiveis) params.append('apenas_disponiveis', '1');
  if (filtros.limit) params.append('limit', String(filtros.limit));

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return requestJson(`/livros${queryString}`, { signal });
};

/**
 * Obtém os detalhes completos e disponibilidade de um livro específico.
 * @param {number|string} id Identificador do livro.
 */
export const detalharLivro = (id, { signal } = {}) =>
  requestJson(`/livros/${id}`, { signal });

/**
 * Cadastra um novo exemplar físico no acervo (Privativo: Bibliotecária / Especialista / Adm).
 * @param {object} dadosLivro Objeto compatível com StoreLivroRequest.
 */
export const cadastrarLivro = (dadosLivro) =>
  requestJson('/livros', { method: 'POST', body: dadosLivro });

/**
 * Importa livros em massa (Mass Assignment) via arquivo CSV (Privativo: Bibliotecária / Especialista / Adm).
 * @param {FormData} formData Objeto FormData contendo o arquivo CSV no campo 'arquivo'.
 */
export const importarLivrosCSV = (formData) =>
  requestJson('/livros/importar-csv', { method: 'POST', body: formData });

/**
 * Atualiza os dados de um livro existente (Privativo: Bibliotecária / Especialista / Adm).
 * @param {number|string} id Identificador do livro.
 * @param {object} dadosLivro Objeto compatível com UpdateLivroRequest.
 */
export const editarLivro = (id, dadosLivro) =>
  requestJson(`/livros/${id}`, { method: 'PUT', body: dadosLivro });

/**
 * Remove um exemplar do acervo físico (Privativo: Bibliotecária / Especialista / Adm).
 * @param {number|string} id Identificador do livro.
 */
export const excluirLivro = async (id) => {
  const response = await api(`/livros/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Não foi possível excluir o livro.');
  }
  return true;
};

// ============================================================================
// 2. Empréstimos de Livros (Rotas /api/emprestimos)
// ============================================================================

/**
 * Consulta o histórico e os empréstimos ativos do usuário logado.
 */
export const meusEmprestimos = ({ signal } = {}) =>
  requestJson('/emprestimos/meus-emprestimos', { signal });

/**
 * Solicita a retirada de um livro físico da biblioteca escolar.
 * @param {object} dados Objeto com livro_id, data_prevista_devolucao e observacoes.
 */
export const solicitarEmprestimo = (dados) =>
  requestJson('/emprestimos/solicitar', { method: 'POST', body: dados });

/**
 * Atualiza o status do empréstimo (Aprovar, Devolver, Renovar - Bibliotecária / Adm).
 * @param {number|string} id Identificador do empréstimo.
 * @param {object} dados Objeto com novo status e observações.
 */
export const atualizarEmprestimo = (id, dados) =>
  requestJson(`/emprestimos/${id}/status`, { method: 'PATCH', body: dados });

export const bibliotecaService = {
  listarLivros,
  detalharLivro,
  cadastrarLivro,
  importarLivrosCSV,
  editarLivro,
  excluirLivro,
  meusEmprestimos,
  solicitarEmprestimo,
  atualizarEmprestimo,
};
