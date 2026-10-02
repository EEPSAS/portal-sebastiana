import { useEffect, useState } from 'react';
import { listEventos } from '../services/eventosService';

export const useEventos = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    listEventos({ signal: controller.signal })
      .then(setEvents)
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
  }, [revision]);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setRevision((currentRevision) => currentRevision + 1);
  };

  return { events, loading, error, refresh };
};