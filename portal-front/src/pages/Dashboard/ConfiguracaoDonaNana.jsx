/**
 * ConfiguracaoDonaNana.jsx - Página de Gestão da Persona da Dona Nana
 *
 * Papel Didático:
 * Rota `/dashboard/dona-nana/configuracao` (restrita a Especialistas e Admins).
 * Renderiza o painel de personalização exportado pelo módulo `dona-nana`.
 */

import { ConfiguracaoDonaNana } from "../../components/Dashboard/dona-nana";

const ConfiguracaoDonaNanaPage = () => {
  return <ConfiguracaoDonaNana />;
};

export default ConfiguracaoDonaNanaPage;
