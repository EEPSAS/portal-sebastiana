/**
 * googleBooksService.js - Integração com a Google Books API v1 para Cadastro de Acervo
 *
 * Papel Didático:
 * Centraliza a consulta assíncrona na API pública do Google Books para auxiliar
 * o preenchimento automático de fichas catalográficas no cadastro de exemplares
 * físicos da biblioteca escolar, normalizando os campos (incluindo miniaturas HTTPS,
 * datas ISO e ISBN) para o formato exato esperado pelo back-end Laravel.
 */

const API_KEY = (import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '').trim();
const API_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Converte datas parciais do Google Books (ex: "2020" ou "2020-05")
 * para o formato ISO completo "YYYY-MM-DD" exigido pelo input date e pelo back-end.
 */
const normalizarDataPublicacao = (dataBruta) => {
  if (!dataBruta) return '';
  const limpo = String(dataBruta).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return limpo;
  if (/^\d{4}-\d{2}$/.test(limpo)) return `${limpo}-01`;
  if (/^\d{4}$/.test(limpo)) return `${limpo}-01-01`;
  return '';
};

/**
 * Extrai o identificador ISBN-13 ou ISBN-10 da obra para sugerir como código do livro.
 */
const extrairCodigoIsbn = (identificadores = []) => {
  if (!Array.isArray(identificadores) || identificadores.length === 0) return '';
  const isbn13 = identificadores.find((id) => id.type === 'ISBN_13');
  if (isbn13?.identifier) return `ISBN-${isbn13.identifier}`;
  const isbn10 = identificadores.find((id) => id.type === 'ISBN_10');
  if (isbn10?.identifier) return `ISBN-${isbn10.identifier}`;
  return identificadores[0]?.identifier || '';
};

/**
 * Pesquisa livros na Google Books API v1 e retorna os dados compatíveis com o back-end.
 *
 * @param {string} termo Título, autor ou ISBN digitado no campo de busca com lupa.
 * @param {object} [options] Opções de requisição (ex.: AbortSignal).
 * @returns {Promise<Array>} Lista normalizada de livros encontrados.
 */
export const searchGoogleBooks = async (termo, { signal } = {}) => {
  const consulta = termo?.trim();
  if (!consulta) return [];

  const params = new URLSearchParams({
    q: consulta,
    maxResults: '8',
    printType: 'books',
  });

  if (API_KEY) {
    params.append('key', API_KEY);
  }

  let response = await fetch(`${API_BASE_URL}?${params.toString()}`, { signal });

  // Caso a chave configurada esteja com restrição de API no console, tenta sem chave (cota pública gratuita)
  if (!response.ok && API_KEY && (response.status === 400 || response.status === 403)) {
    const paramsPublicos = new URLSearchParams({
      q: consulta,
      maxResults: '8',
      printType: 'books',
    });
    response = await fetch(`${API_BASE_URL}?${paramsPublicos.toString()}`, { signal });
  }

  if (!response.ok) {
    throw new Error(
      'Não foi possível consultar o catálogo do Google Books no momento. Verifique sua conexão e tente novamente.'
    );
  }

  const data = await response.json();

  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  // Normaliza cada volume para coincidir 1:1 com o payload esperado pelo StoreLivroRequest no back-end
  return data.items.map((item) => {
    const info = item.volumeInfo || {};
    const miniaturaBruta =
      info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
    // Garante protocolo seguro HTTPS e remove efeito de dobra de página (edge=curl)
    const miniaturaHttps = miniaturaBruta
      ? miniaturaBruta.replace(/^http:/i, 'https:').replace('&edge=curl', '')
      : '';

    const autorFormatado =
      Array.isArray(info.authors) && info.authors.length > 0
        ? info.authors.join(', ')
        : 'Autor desconhecido';

    const generoFormatado =
      Array.isArray(info.categories) && info.categories.length > 0
        ? info.categories[0]
        : '';

    const dataLancamentoIso = normalizarDataPublicacao(info.publishedDate);
    const codigoSugerido = extrairCodigoIsbn(info.industryIdentifiers);

    return {
      id: item.id,
      // Campos compatíveis com o back-end (StoreLivroRequest / Model Livro)
      codigo_livro: codigoSugerido,
      titulo: info.title || 'Título desconhecido',
      autor: autorFormatado,
      editora: info.publisher || '',
      genero: generoFormatado,
      data_lancamento: dataLancamentoIso,
      capa: miniaturaHttps,
      // Campos auxiliares para pré-visualização na lista de seleção
      thumbnail: miniaturaHttps,
      anoPublicacao: info.publishedDate ? String(info.publishedDate).slice(0, 4) : '',
      paginas: info.pageCount || null,
      descricao: info.description || info.subtitle || '',
    };
  });
};
