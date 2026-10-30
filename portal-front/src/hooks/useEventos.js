/**
 * useEventos.js - Hook Customizado de Gestão de Eventos do Calendário (Módulo 4)
 *
 * Papel Didático:
 * Centraliza a leitura (GET /api/eventos) e as mutações (POST, PATCH, DELETE)
 * do calendário escolar em um único hook coeso, evitando a fragmentação em
 * micro-hooks desnecessários.
 * - No Portal Público (sem token): retorna apenas eventos institucionais (Especialista/Adm).
 * - No Dashboard (autenticado): retorna eventos institucionais + eventos pessoais do usuário logado.
 */

import { useEffect, useState } from 'react';
import {
  createEvento,
  createEventosEmMassa,
  deleteEvento,
  listEventos,
  updateEvento,
} from '../services/eventosService';

export const useEventos = ({ token, publico = false } = {}) => {
  const [result, setResult] = useState({ requestKey: null, eventos: [], error: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const requestKey = `${token || ''}:${publico ? 'pub' : 'auth'}:${refreshKey}`;

  // Busca automática na montagem ou quando a chave de atualização muda
  useEffect(() => {
    const controller = new AbortController();

    listEventos({ signal: controller.signal, token, publico })
      .then((eventos) => {
        setResult({ requestKey, eventos, error: null });
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setResult({ requestKey, eventos: [], error: requestError });
        }
      });

    return () => controller.abort();
  }, [token, publico, refreshKey, requestKey]);

  // Força nova busca na API após criar, editar ou excluir um evento
  const refresh = () => setRefreshKey((currentKey) => currentKey + 1);

  // Executa uma operação de escrita (criar, editar ou excluir) com controle de estado saving/error
  const runMutation = async (operation) => {
    setSaving(true);
    setMutationError(null);
    try {
      const data = await operation();
      refresh();
      return { success: true, data };
    } catch (requestError) {
      setMutationError(requestError);
      return { success: false, error: requestError };
    } finally {
      setSaving(false);
    }
  };

  const create = (evento) => runMutation(() => createEvento(evento, { token }));
  const createEmMassa = (eventos) => runMutation(() => createEventosEmMassa(eventos, { token }));
  const update = (evento) => runMutation(() => updateEvento(evento, { token }));
  const remove = (id) => runMutation(() => deleteEvento(id, { token }));

  return {
    eventos: result.eventos,
    loading: result.requestKey !== requestKey,
    error: result.requestKey === requestKey ? result.error : null,
    refresh,
    create,
    createEmMassa,
    update,
    remove,
    saving,
    mutationError,
    clearMutationError: () => setMutationError(null),
  };
};
