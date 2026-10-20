import { useState, useEffect } from 'react';
import { fetchAgendaData } from '../../../services/geralService';

export function useAgenda() {
  const [agendaItens, setAgendaItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAgenda() {
      try {
        setLoading(true);
        const dados = await fetchAgendaData();
        if (isMounted) setAgendaItens(dados);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAgenda();

    return () => {
      isMounted = false;
    };
  }, []);

  return { agendaItens, loading, error };
}