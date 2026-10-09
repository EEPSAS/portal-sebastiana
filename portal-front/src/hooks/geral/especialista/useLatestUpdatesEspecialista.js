import { useState, useEffect } from 'react';
import { fetchLatestUpdates } from '../../../services/geralService';

export function useUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUpdates() {
      try {
        setLoading(true);
        const data = await fetchLatestUpdates();
        if (isMounted) {
          setUpdates(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  return { updates, loading, error };
}