import { useEffect, useState } from 'react';
import { getNoticia, listNoticias } from '../services/noticiasService';

export const useNoticias = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    listNoticias({ signal: controller.signal })
      .then(setNoticias)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return { noticias, loading, error };
};

export const useNoticia = (id) => {
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedId, setLoadedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getNoticia(id, { signal: controller.signal })
      .then((result) => {
        setNoticia(result);
        setError(null);
        setLoadedId(id);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError);
          setLoadedId(id);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [id]);

  return {
    noticia,
    loading: loading || loadedId !== id,
    error: loadedId === id ? error : null,
  };
};