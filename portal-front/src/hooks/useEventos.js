import { useEffect, useState } from 'react';
import { listEventos } from '../services/eventosService';

export const useEventos = ({ token } = {}) => {
  const [result, setResult] = useState({ requestKey: null, eventos: [], error: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const requestKey = `${token || ''}:${refreshKey}`;

  useEffect(() => {
    const controller = new AbortController();

    listEventos({ signal: controller.signal, token })
      .then((eventos) => {
        setResult({ requestKey, eventos, error: null });
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setResult({ requestKey, eventos: [], error: requestError });
        }
      });

    return () => controller.abort();
  }, [token, refreshKey, requestKey]);

  const refresh = () => setRefreshKey((currentKey) => currentKey + 1);

  return {
    eventos: result.eventos,
    loading: result.requestKey !== requestKey,
    error: result.requestKey === requestKey ? result.error : null,
    refresh,
  };
};