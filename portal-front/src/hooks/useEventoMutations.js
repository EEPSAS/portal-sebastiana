import { useState } from 'react';
import {
  createEvento,
  deleteEvento as deleteEventoRequest,
  updateEvento,
} from '../services/eventosService';

export const useEventoMutations = ({ refresh }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveEvento = async (event) => {
    setSaving(true);
    setError(null);

    try {
      const savedEvent = event.id
        ? await updateEvento(event.id, event)
        : await createEvento(event);

      refresh();
      return savedEvent;
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível salvar o evento.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const removeEvento = async (eventId) => {
    setSaving(true);
    setError(null);

    try {
      await deleteEventoRequest(eventId);
      refresh();
      return true;
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível excluir o evento.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearError = () => setError(null);

  return { saveEvento, removeEvento, saving, error, clearError };
};