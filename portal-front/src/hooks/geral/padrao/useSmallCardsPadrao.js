import { useState, useEffect } from 'react';
import { fetchStudentStats, updateStudentReading } from '../../../services/geralService';

export function useStudentStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchStudentStats();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Função para atualizar a Leitura Atual no estado e na API
  const handleUpdateReading = async (dadosLivro) => {
    setStats((prev) => ({
      ...prev,
      leituraAtual: { ...prev.leituraAtual, ...dadosLivro }
    }));
    await updateStudentReading(dadosLivro);
  };

  return { stats, loading, error, handleUpdateReading };
}