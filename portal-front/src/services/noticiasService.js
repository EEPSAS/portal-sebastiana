/**
 * noticiasService.js - Serviço de Integração de Notícias Escolares (Módulo 2)
 *
 * Papel Didático:
 * Centraliza todas as chamadas HTTP para os endpoints de Notícias (/api/noticias),
 * garantindo que componentes visuais nunca façam requisições fetch diretas.
 * Trata respostas da API, erros de validação (HTTP 422) e padroniza payloads
 * conforme contratado no apiContract.md.
 */

import { api } from './api';

/**
 * Função utilitária interna para requisições padronizadas com tratamento de erros.
 */
const request = async (path, { method = 'GET', body, signal } = {}) => {
  const response = await api(path, {
    method,
    body,
    signal,
  });

  // Resposta 204 No Content não possui corpo JSON
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || `Não foi possível concluir a operação de notícias (${response.status}).`
    );
    error.status = response.status;
    error.errors = data?.errors || null;
    throw error;
  }

  return data;
};

/**
 * Converte os dados brutos da API para o formato padronizado do frontend.
 */
export const mapNoticia = (noticia) => {
  if (!noticia) return null;

  return {
    ...noticia,
    id: noticia.id,
    titulo: noticia.titulo || '',
    descricao: noticia.descricao || noticia.conteudo?.slice(0, 160) || '',
    conteudo: noticia.conteudo || '',
    categoria: noticia.categoria || 'Geral',
    url_foto: noticia.url_foto || noticia.imagem || '',
    url_miniatura: noticia.url_miniatura || noticia.miniatura || noticia.url_foto || noticia.imagem || '',
    imagem: noticia.url_foto || noticia.imagem || '',
    destaque: Boolean(noticia.destaque),
    autor: noticia.autor?.name || noticia.autor || 'Portal EEPSAS',
    autorId: noticia.autor?.id || noticia.autor_id || null,
    data_publicacao: noticia.data_publicacao || noticia.created_at || '',
    dataPublicacao: noticia.data_publicacao
      ? new Date(noticia.data_publicacao).toLocaleDateString('pt-BR')
      : (noticia.created_at ? new Date(noticia.created_at).toLocaleDateString('pt-BR') : ''),
    createdAt: noticia.created_at || '',
  };
};

/**
 * Lista as notícias cadastradas no portal escolar.
 * Suporta paginação declarativa e mantém compatibilidade com arrays puros.
 *
 * @param {object} options Opções de consulta (page, perPage, all, signal)
 * @returns {Promise<Array>} Array de notícias com metadados de paginação anexados
 */
export const listNoticias = async ({ page, perPage, all, signal } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (perPage) params.append('per_page', perPage);
  if (all) params.append('all', 'true');

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const responseData = await request(`/noticias${queryString}`, { signal });

  // 1. Resposta paginada padrão do Laravel { data: [...], meta: {...} }
  if (responseData && Array.isArray(responseData.data)) {
    const itens = responseData.data.map(mapNoticia);
    itens.paginacao = {
      total: responseData.meta?.total ?? itens.length,
      paginaAtual: responseData.meta?.current_page ?? (page || 1),
      totalPaginas: responseData.meta?.last_page ?? 1,
      porPagina: responseData.meta?.per_page ?? (perPage || 10),
    };
    itens.dados = itens;
    return itens;
  }

  // 2. Resposta em array simples (ex: Home pública)
  const itens = Array.isArray(responseData) ? responseData.map(mapNoticia) : [];
  itens.paginacao = {
    total: itens.length,
    paginaAtual: 1,
    totalPaginas: 1,
    porPagina: itens.length,
  };
  itens.dados = itens;
  return itens;
};

// Aliases em português para conformidade didática
export const listarNoticias = listNoticias;

/**
 * Busca os detalhes de uma notícia específica pelo ID.
 */
export const getNoticia = async (id, { signal } = {}) => {
  const data = await request(`/noticias/${encodeURIComponent(id)}`, { signal });
  return mapNoticia(data);
};

export const obterNoticia = getNoticia;

/**
 * Cadastra uma nova notícia no portal escolar.
 * Rota protegida: POST /api/noticias
 */
export const createNoticia = async (dados) => {
  const payload = {
    titulo: dados.titulo,
    categoria: dados.categoria || 'Geral',
    descricao: dados.descricao || '',
    conteudo: dados.conteudo,
    url_foto: dados.url_foto || null,
    url_miniatura: dados.url_miniatura || dados.url_foto || null,
    destaque: Boolean(dados.destaque),
  };

  const response = await request('/noticias', {
    method: 'POST',
    body: payload,
  });

  return mapNoticia(response);
};

export const criarNoticia = createNoticia;

/**
 * Atualiza os dados de uma notícia existente.
 * Rota protegida: PUT /api/noticias/{id}
 */
export const updateNoticia = async (id, dados) => {
  const payload = {
    titulo: dados.titulo,
    categoria: dados.categoria,
    descricao: dados.descricao,
    conteudo: dados.conteudo,
    url_foto: dados.url_foto || null,
    url_miniatura: dados.url_miniatura || dados.url_foto || null,
    destaque: Boolean(dados.destaque),
  };

  const response = await request(`/noticias/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });

  return mapNoticia(response);
};

export const atualizarNoticia = updateNoticia;

/**
 * Remove uma notícia escolar do sistema.
 * Rota protegida: DELETE /api/noticias/{id}
 */
export const deleteNoticia = async (id) => {
  await request(`/noticias/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return true;
};

export const excluirNoticia = deleteNoticia;

export const noticiasService = {
  listarNoticias,
  obterNoticia,
  criarNoticia,
  atualizarNoticia,
  excluirNoticia,
};