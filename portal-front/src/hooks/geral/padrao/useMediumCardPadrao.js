import { useState, useEffect } from 'react';
import { fetchBoletimDados } from '../../../services/geralService';

export function useBoletim() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para controlar o índice inicial do carrossel
  const [indiceAtual, setIndiceAtual] = useState(0);
  const itensPorPagina = 6;

  useEffect(() => {
    let isMounted = true;
    async function carregarDados() {
      try {
        setLoading(true);
        const resultado = await fetchBoletimDados();
        if (isMounted) setDados(resultado);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    carregarDados();
    return () => { isMounted = false; };
  }, []);

  // Avança em blocos de 6 matérias para manter 6 itens visíveis por página
  const avancar = () => {
    if (indiceAtual + itensPorPagina < dados.length) {
      setIndiceAtual((prev) => Math.min(prev + itensPorPagina, dados.length - itensPorPagina));
    }
  };

  const voltar = () => {
    if (indiceAtual > 0) {
      setIndiceAtual((prev) => Math.max(prev - itensPorPagina, 0));
    }
  };

  // Derivar os itens visíveis com base no índice atual
  const itensVisiveis = dados.slice(indiceAtual, indiceAtual + itensPorPagina);
  const podeAvancar = indiceAtual + itensPorPagina < dados.length;
  const podeVoltar = indiceAtual > 0;
  
  // Descobrir o valor máximo para calcular a altura das barras (100% de altura)
  const maxPontos = Math.max(...dados.map(d => d.pontos), 100);

  return { 
    itensVisiveis, 
    loading, 
    error, 
    avancar, 
    voltar, 
    podeAvancar, 
    podeVoltar,
    maxPontos
  };
}