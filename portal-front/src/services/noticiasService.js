/**
 * noticiasService.js - Serviço de Integração de Notícias Escolares
 *
 * Papel Didático:
 * Centraliza as requisições de notícias utilizando exclusivamente o helper `api`.
 * Mapeia os dados do backend para a convenção em português utilizada nos componentes.
 */

import { api } from './api';

const getJson = async (path, signal) => {
  const response = await api(path, { signal });

  if (!response.ok) {
    throw new Error(`Não foi possível carregar as notícias (${response.status}).`);
  }

  return response.json();
};

/**
 * Converte os dados brutos da API para o formato padronizado do frontend.
 */
export const mapNoticia = (noticia) => ({
  ...noticia,
  descricao: noticia.descricao || noticia.conteudo?.slice(0, 160) || '',
  categoria: noticia.categoria || 'Notícias',
  imagem: noticia.url_foto || '',
  miniatura: noticia.url_miniatura || noticia.url_foto || '',
  autor: noticia.autor?.name || noticia.autor || 'Portal EEPSAS',
  dataPublicacao: noticia.data_publicacao
    ? new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')
    : '',
});

/**
 * Lista as notícias cadastradas no portal escolar.
 */
export const listNoticias = async ({ signal } = {}) => {
  const noticias = await getJson('/noticias', signal);
  return Array.isArray(noticias) ? noticias.map(mapNoticia) : [];
};

// Alias em português para compatibilidade didática
export const listarNoticias = listNoticias;

/**
 * Busca uma notícia específica pelo ID.
 */
export const getNoticia = async (id, { signal } = {}) => {
  const noticia = await getJson(`/noticias/${id}`, signal);
  return mapNoticia(noticia);
};