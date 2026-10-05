import { useState, useEffect } from 'react';
import { fetchResumoTurmas } from '../../services/geralService';

export function useResumoTurmas() {
  const [medias, setMedias] = useState([]);
  const [frequencias, setFrequencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchResumoTurmas();
        setMedias(data.medias || []);
        setFrequencias(data.frequencias || []);
      } catch (err) {
        setError(err.message || 'Erro ao carregar os dados');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { medias, frequencias, loading, error };
}