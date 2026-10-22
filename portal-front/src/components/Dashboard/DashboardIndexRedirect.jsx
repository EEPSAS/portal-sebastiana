/**
 * DashboardIndexRedirect.jsx - Redirecionador da Rota Raiz do Painel (/dashboard)
 *
 * Papel Didático:
 * Quando um usuário autenticado acessa a URL base `/dashboard`, este componente
 * consulta a função pura `getRotaInicial(role)` para enviá-lo ao destino padrão seguro.
 * Com a disponibilização de painéis gerais para todas as roles (incluindo a bibliotecária),
 * todas as roles convergem diretamente para `/dashboard/geral`.
 *
 * O parâmetro `replace: true` impede que o redirecionamento fique gravado no histórico
 * de navegação do botão 'Voltar' do navegador.
 */

import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getRotaInicial } from "../../utils/rolesRoutes";

const DashboardIndexRedirect = () => {
  const { user } = useAuth();
  const destinoInicial = getRotaInicial(user?.role);

  return <Navigate to={destinoInicial} replace />;
};

export default DashboardIndexRedirect;
