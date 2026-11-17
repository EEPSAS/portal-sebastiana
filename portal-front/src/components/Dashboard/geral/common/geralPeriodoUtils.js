/**
 * geralPeriodoUtils.js
 * Utilitários para extração e montagem padronizada das opções de etapas avaliativas.
 */

export function montarOpcoesPeriodoContexto(periodoContexto, rotuloTodos = "Consolidado Geral") {
  if (!periodoContexto) return [];

  const opcoes = [
    {
      valor: "todos",
      rotulo: rotuloTodos,
    },
  ];

  const divisoes = periodoContexto.divisoes_disponiveis || [];
  divisoes.forEach((div) => {
    const pontosTxt = div.pontos !== undefined && div.pontos !== null ? ` (${div.pontos} pts)` : "";
    const atualTxt = div.is_atual ? " • Atual" : "";
    opcoes.push({
      valor: div.nome,
      rotulo: `${div.nome}${pontosTxt}${atualTxt}`,
    });
  });

  return opcoes;
}
