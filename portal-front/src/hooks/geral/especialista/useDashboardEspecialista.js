import { useState, useEffect } from "react";
import { fetchDashboardGeral, montarCardsKpis } from "../../../services/geralService";

/**
 * useDashboardEspecialista.js - Hook Unificado do Painel Analítico (Especialista / Professor / Adm)
 *
 * Papel Didático:
 * Substitui os 3 micro-hooks anteriores (useSmallCardsEspecialista, useMediumCardsEspecialista e
 * useLatestUpdatesEspecialista) por uma única chamada HTTP ao endpoint GET /api/dashboard/geral.
 * Dessa forma evitamos requisições triplicadas e eliminamos a necessidade de cache manual de Promises.
 */
export function useDashboardEspecialista() {
  const [cards, setCards] = useState([]);
  const [medias, setMedias] = useState([]);
  const [frequencias, setFrequencias] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function carregarPainelGeral() {
      try {
        setLoading(true);
        setError(null);

        // Realiza uma única chamada ao backend e distribui as fatias do payload para os estados locais
        const payload = await fetchDashboardGeral();

        if (!isMounted) return;

        setCards(montarCardsKpis(payload?.kpis || {}));
        setMedias(payload?.resumo_turmas?.medias || []);
        setFrequencias(payload?.resumo_turmas?.frequencias || []);
        setUpdates(payload?.ultimas_atualizacoes || []);
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Erro ao carregar os indicadores do painel geral.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    carregarPainelGeral();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    cards,
    medias,
    frequencias,
    updates,
    loading,
    error,
  };
}

