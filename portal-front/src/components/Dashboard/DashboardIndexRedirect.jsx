/**
 * DashboardIndexRedirect.jsx - Redirecionador da Rota Raiz do Painel (/dashboard)
 *
 * Papel Didático:
 * Quando um usuário autenticado acessa a URL base `/dashboard`, este componente verifica
 * seu perfil e o redireciona imediatamente para a tela inicial correspondente:
 * - 'bibliotecario' ➔ /dashboard/biblioteca
 * - demais perfis ('aluno', 'professor', 'especialista', 'adm') ➔ /dashboard/geral
 *
 * O parâmetro `replace: true` impede que o redirecionamento fique gravado no histórico
 * de navegação do botão 'Voltar' do navegador.
 */

import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const DashboardIndexRedirect = () => {
  const { user } = useAuth();
  const role = user?.role || "aluno";
  // Suporta identicamente as denominações 'bibliotecaria' e 'bibliotecario'
  const isBibliotecaria = role === "bibliotecaria" || role === "bibliotecario";
  const destinoInicial = isBibliotecaria ? "/dashboard/biblioteca" : "/dashboard/geral";

  return <Navigate to={destinoInicial} replace />;
};

export default DashboardIndexRedirect;
