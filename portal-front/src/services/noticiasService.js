const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const getJson = async (path, signal) => {
  const response = await fetch(`${API_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`Não foi possível carregar as notícias (${response.status}).`);
  }

  return response.json();
};

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

export const listNoticias = async ({ signal } = {}) => {
  const noticias = await getJson('/noticias', signal);
  return noticias.map(mapNoticia);
};

export const getNoticia = async (id, { signal } = {}) => {
  const noticia = await getJson(`/noticias/${id}`, signal);
  return mapNoticia(noticia);
};