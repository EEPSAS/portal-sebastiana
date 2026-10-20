import { useState } from 'react';
import { createEvento, deleteEvento, updateEvento } from '../services/eventosService';

export const useEventoMutations = ({ token, onSuccess } = {}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const runMutation = async (operation) => {
    setSaving(true);
    setError(null);
    try {
      const data = await operation();
      onSuccess?.();
      return { success: true, data };
    } catch (requestError) {
      setError(requestError);
      return { success: false, error: requestError };
    } finally {
      setSaving(false);
    }
  };

  const create = (evento) => runMutation(() => createEvento(evento, { token }));
  const update = (evento) => runMutation(() => updateEvento(evento, { token }));
  const remove = (id) => runMutation(() => deleteEvento(id, { token }));

  return { create, update, remove, saving, error, clearError: () => setError(null) };
};