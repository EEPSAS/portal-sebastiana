/**
 * ProtectedRoute.jsx - Guarda de Rotas Autenticadas e Controle de Acesso por Perfil
 *
 * Conceito Didático:
 * Em aplicações de página única (SPA), rotas privadas não podem ser acessadas por visitantes
 * anônimos nem por usuários sem a devida permissão. Este componente atua como uma barreira:
 * 1. Enquanto a sessão é verificada na API, exibe um indicador amigável de carregamento.
 * 2. Se não estiver logado, redireciona o usuário para o `/login`.
 * 3. Se o usuário (Aluno ou Professor) estiver com aprovação pendente (`status_confirmacao === 'pendente'`),
 *    redireciona-o obrigatoriamente para a tela semântica de espera (`/dashboard/espera`).
 * 4. Se a rota exigir perfis específicos (`allowedRoles`) e o perfil do usuário não estiver
 *    na lista, redireciona-o automaticamente para a página inicial do seu perfil através de
 *    `getRotaInicial(userRole)`, evitando erros 403 e mantendo a navegação consistente.
 */

import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { getRotaInicial } from '../utils/rolesRoutes';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Estado 1: Carregando a validação inicial do token
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p className="text-muted fw-semibold">Verificando credenciais de acesso...</p>
        </div>
      </div>
    );
  }

  // Estado 2: Usuário não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Estado 3: Usuário (Aluno ou Professor) pendente de aprovação institucional (Diretriz 2.1)
  const isUsuarioPendente =
    !user?.isSimulated &&
    (user?.status_confirmacao === 'pendente' || user?.status_confirmacao === 'inativo');

  // Se o usuário estiver pendente e tentar acessar qualquer área operacional, redireciona para a tela de espera
  if (isUsuarioPendente && location.pathname !== '/dashboard/espera') {
    return <Navigate to="/dashboard/espera" replace />;
  }

  // Se o usuário já estiver confirmado e tentar acessar a tela de espera, redireciona para o painel geral
  if (!isUsuarioPendente && location.pathname === '/dashboard/espera') {
    return <Navigate to="/dashboard/geral" replace />;
  }

  // Estado 4: Validação de perfil (Role-Based Access Control)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || 'aluno';
    const temPermissao = allowedRoles.includes(userRole);

    if (!temPermissao) {
      // Redireciona para o destino padrão seguro de acordo com o perfil
      const rotaPadrao = getRotaInicial(userRole);
      return <Navigate to={rotaPadrao} replace />;
    }
  }

  // Acesso permitido: renderiza as rotas filhas declaradas dentro de ProtectedRoute
  return <Outlet />;
};

export default ProtectedRoute;
