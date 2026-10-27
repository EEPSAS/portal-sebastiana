/**
 * DonaNana.jsx - Página do Painel Dedicado da Dona Nana
 *
 * Papel Didático:
 * Rota `/dashboard/dona-nana`. Serve como entrypoint de página SPA
 * delegando a renderização para o módulo consolidado em `components/Dashboard/dona-nana`.
 */

import DonaNanaChat from "../../components/Dashboard/dona-nana";

const DonaNanaPage = () => {
  return <DonaNanaChat />;
};

export default DonaNanaPage;
