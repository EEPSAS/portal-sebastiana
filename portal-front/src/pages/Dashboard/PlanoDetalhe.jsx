/**
 * PlanoDetalhe.jsx - Página Roteadora de Detalhes do Plano de Estudos (Módulo 3.4)
 *
 * Papel Didático:
 * Atua estritamente como a Thin Page (coordenador de rota) para `/dashboard/biblioteca/planos/:id`.
 * Delega o consumo da API, contadores e seções de materiais para o container
 * especializado em src/components/Dashboard/biblioteca/PlanoDetalhe/.
 */

import PlanoDetalheContainer from "../../components/Dashboard/biblioteca/PlanoDetalhe";

export default function PlanoDetalhePage() {
  return <PlanoDetalheContainer />;
}
