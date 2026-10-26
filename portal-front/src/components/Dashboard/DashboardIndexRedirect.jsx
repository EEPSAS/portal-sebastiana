/**
 * DashboardIndexRedirect.jsx - Redirecionador da Rota Raiz do Painel (/dashboard)
 *
 * Papel Didático:
 * Quando um usuário autenticado acessa a URL base `/dashboard`, este componente
 * verifica se é um professor pendente de confirmação (redirecionando-o para `/dashboard/espera`)
 * e, para os demais casos, consulta a função pura `getRotaInicial(role)` para enviá-lo
 * ao destino padrão seguro (`/dashboard/geral`).
 *
 * O parâmetro `replace: true` impede que o redirecionamento fique gravado no histórico
 * de navegação do botão 'Voltar' do navegador.
 */

import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getRotaInicial } from "../../utils/rolesRoutes";

const DashboardIndexRedirect = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  const isProfessorPendente = role === "professor" && user?.status_confirmacao === "pendente";

  if (isProfessorPendente) {
    return <Navigate to="/dashboard/espera" replace />;
  }

  const destinoInicial = getRotaInicial(role);

  return <Navigate to={destinoInicial} replace />;
};

export default DashboardIndexRedirect;
