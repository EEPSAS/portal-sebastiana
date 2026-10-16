/**
 * googleBooksService.js - Integração com a Google Books API v1
 *
 * Papel Didático:
 * Centraliza a busca assíncrona por livros, resumos e referências pedagógicas
 * na biblioteca digital global do Google Books.
 * 
 * Por que foi feito:
 * Permite que alunos e professores consultem obras complementares, sinopses
 * e prévias acadêmicas diretamente pelo portal da escola.
 */

const API_KEY = (
  import.meta.env.VITE_GOOGLE_BOOKS_API_KEY ||
  import.meta.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY ||
  ''
).trim();
const API_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Pesquisa conteúdos e referências didáticas no Google Books.
 *
 * @param {string} termo Termo de busca digitado pelo estudante ou professor.
 * @param {object} [options] Opções de requisição (ex.: AbortSignal para cancelamento).
 * @returns {Promise<Array>} Lista normalizada de obras encontradas.
 */
export const searchGoogleBooks = async (termo, { signal } = {}) => {
  const consulta = termo?.trim();
  if (!consulta) return [];

  // Monta a query string com parâmetros de pesquisa pedagógica
  const params = new URLSearchParams({
    q: consulta,
    maxResults: '10',
    printType: 'all',
    langRestrict: 'pt',
  });

  if (API_KEY) {
    params.append('key', API_KEY);
  }

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`, { signal });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Acesso à Google Books API não autorizado. Verifique se a API está ativada no Google Cloud Console.');
    }
    throw new Error('Não foi possível consultar os conteúdos no Google Books. Verifique sua conexão e tente novamente.');
  }

  const data = await response.json();

  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  // Normaliza o payload para o formato esperado pelo contrato do portal
  return data.items.map((item) => {
    const info = item.volumeInfo || {};
    const descricao = info.description || info.subtitle || 'Sem descrição cadastrada.';

    return {
      id: item.id,
      titulo: info.title || 'Título desconhecido',
      link: info.previewLink || info.infoLink || '',
      snippet: descricao.length > 250 ? `${descricao.slice(0, 247)}...` : descricao,
      fonte: info.authors ? info.authors.join(', ') : 'Google Books',
      thumbnail: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      dataPublicacao: info.publishedDate || '',
      paginas: info.pageCount || null,
      editora: info.publisher || 'Editora independente',
    };
  });
};
